/**
 * dsh-netease-cdp — DeepSeek Harness plugin entry.
 * Port of https://github.com/canyueY/netease-cdp
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { pathToFileURL } from 'node:url';
import { NeteaseCDP, defaultConfig } from './client.js';
import {
  nextToolSpec,
  nowToolSpec,
  playToolSpec,
  prevToolSpec,
  probeToolSpec,
} from './tool-spec.js';

export const name = 'dsh-netease-cdp';
export const inject = ['tools'];

export { NeteaseCDP, defaultConfig } from './client.js';

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
  ctx.netease = { NeteaseCDP, clientFor: (args) => clientFor(args, ctx) };

  const probe = defineTool({
    ...probeToolSpec(),
    async execute(args) {
      return clientFor(args, ctx).probe();
    },
  });

  const now = defineTool({
    ...nowToolSpec(),
    async execute(args) {
      return clientFor(args, ctx).currentTrack();
    },
  });

  const play = defineTool({
    ...playToolSpec(),
    async execute(args) {
      if (!args?.song_id) throw new Error('song_id is required');
      const nc = clientFor(args, ctx);
      const ok = await nc.play(args.song_id, { force: args.force === true });
      return { ok, track: await nc.currentTrack() };
    },
  });

  const next = defineTool({
    ...nextToolSpec(),
    async execute(args) {
      const nc = clientFor(args, ctx);
      let ok = await nc.nextTrack();
      if (!ok && args?.dom_fallback !== false) ok = await nc.nextTrackDom();
      await new Promise((r) => setTimeout(r, 350));
      return { ok, track: await nc.currentTrack() };
    },
  });

  const prev = defineTool({
    ...prevToolSpec(),
    async execute(args) {
      const nc = clientFor(args, ctx);
      const ok = await nc.previousTrack();
      await new Promise((r) => setTimeout(r, 350));
      return { ok, track: await nc.currentTrack() };
    },
  });

  const disposers = [
    ctx.tools.register(probe),
    ctx.tools.register(now),
    ctx.tools.register(play),
    ctx.tools.register(next),
    ctx.tools.register(prev),
  ];
  return () => {
    for (const dispose of disposers.reverse()) dispose?.();
    delete ctx.netease;
  };
}
