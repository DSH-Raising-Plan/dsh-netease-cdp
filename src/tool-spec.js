export const PROBE_TOOL = 'netease_probe';
export const NOW_TOOL = 'netease_now_playing';
export const SEARCH_TOOL = 'netease_search';
export const PLAY_TOOL = 'netease_play';
export const PLAY_KW_TOOL = 'netease_play_keyword';
export const INSERT_TOOL = 'netease_insert_next';
export const CARD_TOOL = 'netease_play_card';
export const NEXT_TOOL = 'netease_next';
export const PREV_TOOL = 'netease_prev';

const portParam = { type: 'integer', description: 'CDP 端口（默认 9222）' };

function jsonOut(render) {
  return {
    schema: { type: 'json' },
    render: render || ((_a, v) => [{ type: 'text', text: JSON.stringify(v, null, 2) }]),
  };
}

export function probeToolSpec() {
  return {
    name: PROBE_TOOL,
    description: '探测网易云桌面端 CDP 是否可用，并返回当前曲目。点歌前可先调用。',
    parameters: { port: portParam },
    output: jsonOut(),
  };
}

export function nowToolSpec() {
  return {
    name: NOW_TOOL,
    description: '读取网易云桌面客户端当前曲目（经 CDP，使用已登录会话）。',
    parameters: { port: portParam },
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

export function searchToolSpec() {
  return {
    name: SEARCH_TOOL,
    description: [
      '按关键词搜索网易云歌曲（公开搜索接口，无需登录）。',
      '返回候选列表（id/name/artists）。点播请再调 netease_play 或 netease_play_keyword。',
      '听 MV / 分析 PV 时可把结果交给 dsh-video-storyboard-hp 的 video_storyboard。',
    ].join('\n'),
    parameters: {
      keyword: { type: 'string', required: true, description: '歌名 / 歌手 / 关键字' },
      limit: { type: 'integer', description: '返回条数 1–20，默认 5' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          songs: { type: 'json' },
          count: { type: 'integer' },
        },
      },
      render: (_args, value) => {
        const lines = (value.songs || []).map(
          (s, i) => `${i + 1}. ${s.name} — ${s.artists} (id=${s.id})`,
        );
        return [{
          type: 'text',
          text: lines.length
            ? `搜索「${value.keyword}」共 ${value.count} 首：\n${lines.join('\n')}`
            : `没有搜到「${value.keyword}」`,
        }];
      },
    },
  };
}

export function playToolSpec() {
  return {
    name: PLAY_TOOL,
    description: '按 song id 在已登录的网易云桌面客户端点播。',
    parameters: {
      song_id: { type: 'string', required: true, description: '网易云曲目 id' },
      port: portParam,
      force: { type: 'boolean', description: '即使正在播同一首也强制重派发' },
    },
    output: {
      schema: { type: 'object', properties: { ok: { type: 'boolean' }, track: { type: 'json' } } },
      render: (_args, value) => [{
        type: 'text',
        text: value.ok
          ? `已点播：${value.track?.name || _args?.song_id}`
          : `点播失败（song_id=${_args?.song_id}）。确认客户端以 --remote-debugging-port 启动。`,
      }],
    },
  };
}

export function playKeywordToolSpec() {
  return {
    name: PLAY_KW_TOOL,
    description: [
      '一键点歌：搜索关键词并播放第 index 首（默认第 1 首）。',
      '适合「放一首周杰伦的晴天」这类自然语言点歌；先 search 再 play 也可以。',
    ].join('\n'),
    parameters: {
      keyword: { type: 'string', required: true, description: '歌名/歌手关键字' },
      index: { type: 'integer', description: '从 1 开始的候选序号，默认 1' },
      limit: { type: 'integer', description: '搜索候选数，默认 5' },
      port: portParam,
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{
        type: 'text',
        text: value.ok
          ? `已点播：${value.track?.name || value.picked?.name} — ${value.track?.artists || value.picked?.artists}`
          : `点歌失败：${value.error || '未知错误'}`,
      }],
    },
  };
}

export function insertToolSpec() {
  return {
    name: INSERT_TOOL,
    description: '把一首歌插到「下一首播放」（不打断当前曲）。',
    parameters: {
      song_id: { type: 'string', required: true, description: '网易云曲目 id' },
      port: portParam,
    },
    output: {
      schema: { type: 'object', properties: { ok: { type: 'boolean' } } },
      render: (_args, value) => [{ type: 'text', text: value.ok ? '已插入下一首' : '插入失败' }],
    },
  };
}

export function cardToolSpec() {
  return {
    name: CARD_TOOL,
    description: '播放发现页个性化推荐卡片：daily / private_radar / heart_mode / private_roam。',
    parameters: {
      card: {
        type: 'string',
        required: true,
        enum: ['daily', 'private_radar', 'heart_mode', 'private_roam'],
        description: '卡片类型',
      },
      port: portParam,
    },
    output: jsonOut((_a, v) => [{
      type: 'text',
      text: v.ok
        ? `已播放 ${v.card}：${v.track?.name || v.label || ''}`
        : `播放卡片失败：${v.reason || 'unknown'}`,
    }]),
  };
}

export function nextToolSpec() {
  return {
    name: NEXT_TOOL,
    description: '下一首。',
    parameters: {
      port: portParam,
      dom_fallback: { type: 'boolean', description: 'Redux 失败时点 DOM 按钮（默认 true）' },
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
    description: '上一首。',
    parameters: { port: portParam },
    output: {
      schema: { type: 'object', properties: { ok: { type: 'boolean' }, track: { type: 'json' } } },
      render: (_args, value) => [{ type: 'text', text: value.ok ? `上一首：${value.track?.name || ''}` : '上一首失败' }],
    },
  };
}
