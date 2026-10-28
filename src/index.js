/**
 * dsh-netease-cdp — DeepSeek Harness 点歌插件（CDP 驱动已登录客户端）。
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { pathToFileURL } from 'node:url';
import { NeteaseCDP, defaultConfig } from './client.js';
import { playDiscoverCard } from './discover.js';
import { searchSongs } from './search.js';
import {
  cardToolSpec,
  insertToolSpec,
  nextToolSpec,
  nowToolSpec,
  playKeywordToolSpec,
  playToolSpec,
  prevToolSpec,
  probeToolSpec,
  searchToolSpec,
} from './tool-spec.js';

export const name = 'dsh-netease-cdp';
export const inject = ['tools'];

export { NeteaseCDP, defaultConfig } from './client.js';
export { searchSongs } from './search.js';

async function loadDefineTool() {
  try {
    const mod = await import('@deepseek-ai/dsh-tools');
    if (mod?.defineTool) return mod.defineTool;
  } catch { /* fall through */ }
  const override = process.env.DSH_TOOLS_PATH;
  if (override) {
    const mod = await import(pathToFileURL(override).href);
    if (mod?.defineTool) return mod.defineTool;
  }
  throw new Error('cannot resolve @deepseek-ai/dsh-tools (set DSH_TOOLS_PATH for local dev)');
}

function clientFor(args, ctx) {
  const base = defaultConfig({
    port: Number(args?.port || ctx?.config?.['dsh-netease-cdp']?.port || process.env.NETEASE_CDP_PORT || 9222),
    ...(ctx?.config?.['dsh-netease-cdp'] || {}),
  });
  return new NeteaseCDP(base);
}

export async function apply(ctx) {
  const defineTool = await loadDefineTool();

  // 给其它插件复用（对齐 dsh-music-plugin 的 ctx.music 思路）
  ctx.netease = {
    NeteaseCDP,
    clientFor: (args) => clientFor(args, ctx),
    search: searchSongs,
    async play(songId, args) {
      const nc = clientFor(args, ctx);
      return nc.play(songId);
    },
  };

  const tools = [
    defineTool({
      ...probeToolSpec(),
      async execute(args) { return clientFor(args, ctx).probe(); },
    }),
    defineTool({
      ...nowToolSpec(),
      async execute(args) { return clientFor(args, ctx).currentTrack(); },
    }),
    defineTool({
      ...searchToolSpec(),
      async execute(args) {
        if (!args?.keyword) throw new Error('keyword is required');
        const songs = await searchSongs(args.keyword, { limit: args.limit ?? 5 });
        return { keyword: args.keyword, songs, count: songs.length };
      },
    }),
    defineTool({
      ...playToolSpec(),
      async execute(args) {
        if (!args?.song_id) throw new Error('song_id is required');
        const nc = clientFor(args, ctx);
        const ok = await nc.play(args.song_id, { force: args.force === true });
        return { ok, track: await nc.currentTrack() };
      },
    }),
    defineTool({
      ...playKeywordToolSpec(),
      async execute(args) {
        if (!args?.keyword) throw new Error('keyword is required');
        const songs = await searchSongs(args.keyword, { limit: args.limit ?? 5 });
        const idx = Math.max(1, Number(args.index) || 1) - 1;
        const picked = songs[idx];
        if (!picked) {
          return { ok: false, error: `候选不足（共 ${songs.length} 首，index=${idx + 1}）`, songs };
        }
        const nc = clientFor(args, ctx);
        const ok = await nc.play(picked.id);
        return {
          ok,
          picked,
          track: await nc.currentTrack(),
          candidates: songs,
          tip: '若这是 PV/现场，可用 dsh-video-storyboard-hp 的 video_storyboard 看画面结构',
        };
      },
    }),
    defineTool({
      ...insertToolSpec(),
      async execute(args) {
        if (!args?.song_id) throw new Error('song_id is required');
        const ok = await clientFor(args, ctx).insertNext(args.song_id);
        return { ok };
      },
    }),
    defineTool({
      ...cardToolSpec(),
      async execute(args) {
        if (!args?.card) throw new Error('card is required');
        return playDiscoverCard(clientFor(args, ctx), args.card);
      },
    }),
    defineTool({
      ...nextToolSpec(),
      async execute(args) {
        const nc = clientFor(args, ctx);
        let ok = await nc.nextTrack();
        if (!ok && args?.dom_fallback !== false) ok = await nc.nextTrackDom();
        await new Promise((r) => setTimeout(r, 350));
        return { ok, track: await nc.currentTrack() };
      },
    }),
    defineTool({
      ...prevToolSpec(),
      async execute(args) {
        const nc = clientFor(args, ctx);
        const ok = await nc.previousTrack();
        await new Promise((r) => setTimeout(r, 350));
        return { ok, track: await nc.currentTrack() };
      },
    }),
  ];

  const disposers = tools.map((t) => ctx.tools.register(t));
  return () => {
    for (const dispose of disposers.reverse()) dispose?.();
    delete ctx.netease;
  };
}
