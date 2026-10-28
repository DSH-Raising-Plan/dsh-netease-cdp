/**
 * NetEase Cloud Music CDP client (Node port of canyueY/netease-cdp).
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { URL } from 'node:url';
import WebSocket from 'ws';
import {
  CURRENT_TRACK_BODY,
  CURRENT_TRACK_ID_BODY,
  IS_PLAYING_BODY,
  NEXT_DOM_JS,
  PLAY_NEXT_DATA,
  PLAY_PREV_DATA,
  dispatchBody,
  insertNextData,
  playTrackData,
  wrap,
} from './js.js';

export class CDPUnavailable extends Error {
  constructor(message) {
    super(message);
    this.name = 'CDPUnavailable';
  }
}

export class ScriptError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScriptError';
  }
}

export class CDPTimeout extends Error {
  constructor(message) {
    super(message);
    this.name = 'CDPTimeout';
  }
}

export function defaultConfig(overrides = {}) {
  return {
    port: 9222,
    ws_url: '',
    timeout: 3.5,
    retries: 3,
    settle_sec: 0.35,
    url_hints: ['music.163.com', 'orpheus', 'y.163.com'],
    allow_url_fallback: true,
    allowed_hosts: ['127.0.0.1', 'localhost', '[::1]', '::1'],
    allow_remote_host: false,
    ...overrides,
  };
}

function sleep(sec) {
  return new Promise((r) => setTimeout(r, sec * 1000));
}

export async function fetchTargets(cfg) {
  const url = `http://127.0.0.1:${cfg.port}/json`;
  let resp;
  try {
    resp = await fetch(url, { signal: AbortSignal.timeout(cfg.timeout * 1000) });
  } catch (err) {
    throw new CDPUnavailable(
      `连不上 CDP 端口 ${cfg.port}（${url}）：${err.message}。` +
      `网易云需要以 --remote-debugging-port=${cfg.port} 启动。`,
    );
  }
  const data = await resp.json();
  if (!Array.isArray(data)) {
    throw new CDPUnavailable(`${url} 返回 ${typeof data}，期望数组`);
  }
  return data.filter((t) => t && typeof t === 'object');
}

export function pickPageTarget(targets, cfg) {
  const pages = targets.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!pages.length) {
    throw new CDPUnavailable(`CDP 端口 ${cfg.port} 上没有可用的 page`);
  }
  const hints = (cfg.url_hints || []).map((h) => String(h).toLowerCase()).filter(Boolean);
  for (const hint of hints) {
    for (const t of pages) {
      if (String(t.url || '').toLowerCase().includes(hint)) return t;
    }
  }
  if (cfg.allow_url_fallback) return pages[0];
  throw new CDPUnavailable(`端口 ${cfg.port} 上没有 URL 命中 ${hints} 的页面`);
}

function checkHost(wsUrl, cfg) {
  if (cfg.allow_remote_host) return;
  const host = (new URL(wsUrl).hostname || '').toLowerCase();
  const allowed = new Set((cfg.allowed_hosts || []).map((h) => String(h).replace(/^\[|\]$/g, '').toLowerCase()));
  if (!allowed.has(host)) {
    throw new CDPUnavailable(
      `拒绝连接到非本机 CDP 端点 ${host}（允许：${[...allowed].sort().join(', ')}）`,
    );
  }
}

export async function debuggerTarget(cfg) {
  if (cfg.ws_url) {
    checkHost(cfg.ws_url, cfg);
    return { type: 'page', url: '', title: '', webSocketDebuggerUrl: cfg.ws_url };
  }
  const target = pickPageTarget(await fetchTargets(cfg), cfg);
  checkHost(String(target.webSocketDebuggerUrl), cfg);
  return target;
}

export { wrap } from './js.js';

export async function evaluate(expression, cfg = defaultConfig(), { timeout = null, msgId = 1 } = {}) {
  const limit = Number(timeout ?? cfg.timeout);
  const target = await debuggerTarget(cfg);
  const wsUrl = String(target.webSocketDebuggerUrl);
  const payload = JSON.stringify({
    id: msgId,
    method: 'Runtime.evaluate',
    params: { expression, returnByValue: true, awaitPromise: true },
  });

  return await new Promise((resolve, reject) => {
    let settled = false;
    const ws = new WebSocket(wsUrl, { handshakeTimeout: Math.ceil(limit * 1000) });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch { /* ignore */ }
      reject(new CDPTimeout(`CDP 指令超时（>${limit.toFixed(1)}s）`));
    }, limit * 1000);

    const done = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      fn(arg);
    };

    ws.on('error', (err) => done(reject, new CDPUnavailable(`WebSocket 连接失败（${wsUrl}）：${err.message}`)));
    ws.on('open', () => ws.send(payload));
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(String(raw)); } catch { return; }
      if (!msg || typeof msg !== 'object' || msg.id !== msgId) return;
      const result = msg.result || {};
      if (result.exceptionDetails) {
        const exc = result.exceptionDetails.exception || {};
        const detail = String(
          exc.description || result.exceptionDetails.text || 'CDP 执行异常',
        );
        done(reject, new ScriptError(detail));
        return;
      }
      done(resolve, (result.result || {}).value);
    });
  });
}

export class NeteaseCDP {
  constructor(config = null) {
    this.config = defaultConfig(config || {});
  }

  async available() {
    try {
      await debuggerTarget(this.config);
      return true;
    } catch {
      return false;
    }
  }

  async probe() {
    const out = { available: false, url: '', title: '', track: null, error: '' };
    try {
      const target = await debuggerTarget(this.config);
      out.available = true;
      out.url = String(target.url || '');
      out.title = String(target.title || '');
      out.track = await this.currentTrack();
    } catch (err) {
      out.error = String(err.message || err);
    }
    return out;
  }

  async isPlaying() {
    try {
      return Boolean(await evaluate(wrap(IS_PLAYING_BODY), this.config));
    } catch {
      return false;
    }
  }

  async currentTrackId() {
    try {
      return String(await evaluate(wrap(CURRENT_TRACK_ID_BODY), this.config) || '').trim();
    } catch {
      return '';
    }
  }

  async currentTrack() {
    try {
      const raw = await evaluate(wrap(CURRENT_TRACK_BODY), this.config);
      if (!raw || typeof raw !== 'object') {
        return { id: '', name: '', artists: '', playing: false, duration: 0 };
      }
      return {
        id: String(raw.id || ''),
        name: String(raw.name || ''),
        artists: String(raw.artists || ''),
        playing: Boolean(raw.playing),
        duration: Number(raw.duration) || 0,
      };
    } catch {
      return { id: '', name: '', artists: '', playing: false, duration: 0 };
    }
  }

  async _dispatch(actionId, dataJs) {
    try {
      return Boolean(await evaluate(wrap(dispatchBody(actionId, dataJs)), this.config));
    } catch {
      return false;
    }
  }

  async play(songId, { retries = null, settleSec = null, force = false } = {}) {
    const sid = Number.parseInt(songId, 10);
    if (!Number.isFinite(sid)) return false;
    if (!force) {
      const current = await this.currentTrackId();
      if (current && current === String(sid)) return true;
    }
    const attempts = Math.max(1, Number(retries ?? this.config.retries));
    const pause = Number(settleSec ?? this.config.settle_sec);
    const data = playTrackData(sid);
    for (let i = 0; i < attempts; i++) {
      if (await this._dispatch('play', data)) {
        await sleep(pause);
        if ((await this.currentTrackId()) === String(sid) || (await this.isPlaying())) return true;
      }
      if (i + 1 < attempts) await sleep(Math.max(0.6, pause));
    }
    return false;
  }

  async insertNext(songId) {
    const sid = Number.parseInt(songId, 10);
    if (!Number.isFinite(sid)) return false;
    return this._dispatch('addToPlayList', insertNextData(sid));
  }

  async nextTrack() {
    return this._dispatch('playNext', PLAY_NEXT_DATA);
  }

  async previousTrack() {
    return this._dispatch('playPrev', PLAY_PREV_DATA);
  }

  async nextTrackDom() {
    try {
      return Boolean(await evaluate(NEXT_DOM_JS, this.config));
    } catch {
      return false;
    }
  }
}
