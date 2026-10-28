export const PROBE_TOOL = 'netease_probe';
export const NOW_TOOL = 'netease_now_playing';
export const PLAY_TOOL = 'netease_play';
export const NEXT_TOOL = 'netease_next';
export const PREV_TOOL = 'netease_prev';

export function probeToolSpec() {
  return {
    name: PROBE_TOOL,
    description: 'Probe whether NetEase Cloud Music CDP is reachable and what is currently playing.',
    parameters: {
      port: {
        type: 'integer',
        description: 'Remote debugging port (default 9222).',
      },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
  };
}

export function nowToolSpec() {
  return {
    name: NOW_TOOL,
    description: 'Get the currently playing track from the NetEase Cloud Music desktop client (via CDP).',
    parameters: {
      port: { type: 'integer', description: 'CDP port (default 9222).' },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => {
        if (!value?.id) return [{ type: 'text', text: '没有取到当前曲目（客户端未开调试端口或未在播）。' }];
        const state = value.playing ? 'playing' : 'paused';
        return [{ type: 'text', text: `${value.name} — ${value.artists} (${state}, id=${value.id})` }];
      },
    },
  };
}

export function playToolSpec() {
  return {
    name: PLAY_TOOL,
    description: 'Play a NetEase track by song id in the already-logged-in desktop client.',
    parameters: {
      song_id: {
        type: 'string',
        required: true,
        description: 'NetEase track id (numeric string).',
      },
      port: { type: 'integer', description: 'CDP port (default 9222).' },
      force: {
        type: 'boolean',
        description: 'Re-dispatch even if this track is already current.',
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          track: { type: 'json' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.ok
          ? `已点播：${value.track?.name || argsSong(_args)}`
          : `点播失败（song_id=${argsSong(_args)}）。确认客户端以 --remote-debugging-port 启动。`,
      }],
    },
  };
}

function argsSong(args) {
  return args?.song_id ?? '';
}

export function nextToolSpec() {
  return {
    name: NEXT_TOOL,
    description: 'Skip to the next track in NetEase Cloud Music.',
    parameters: {
      port: { type: 'integer', description: 'CDP port (default 9222).' },
      dom_fallback: {
        type: 'boolean',
        description: 'If Redux playNext fails, click the DOM next button.',
      },
    },
    output: {
      schema: { type: 'object', properties: { ok: { type: 'boolean' }, track: { type: 'json' } } },
      render: (_args, value) => [{ type: 'text', text: value.ok ? `下一首：${value.track?.name || ''}` : '下一首失败' }],
    },
  };
}

export function prevToolSpec() {
  return {
    name: PREV_TOOL,
    description: 'Go to the previous track in NetEase Cloud Music.',
    parameters: {
      port: { type: 'integer', description: 'CDP port (default 9222).' },
    },
    output: {
      schema: { type: 'object', properties: { ok: { type: 'boolean' }, track: { type: 'json' } } },
      render: (_args, value) => [{ type: 'text', text: value.ok ? `上一首：${value.track?.name || ''}` : '上一首失败' }],
    },
  };
}
