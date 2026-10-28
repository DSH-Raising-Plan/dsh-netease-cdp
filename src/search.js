/**
 * NetEase Cloud Music search (public web API — no login).
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const SEARCH_URL = 'https://music.163.com/api/search/get/web';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://music.163.com/',
};

export async function searchSongs(keyword, { limit = 5, signal = null } = {}) {
  const q = String(keyword || '').trim();
  if (!q) return [];
  const url = new URL(SEARCH_URL);
  url.searchParams.set('s', q);
  url.searchParams.set('type', '1');
  url.searchParams.set('limit', String(Math.max(1, Math.min(20, Number(limit) || 5))));
  const resp = await fetch(url, { headers: HEADERS, signal });
  if (!resp.ok) throw new Error(`网易云搜索失败 HTTP ${resp.status}`);
  const data = await resp.json();
  const songs = data?.result?.songs || [];
  const out = [];
  for (const s of songs) {
    if (s?.id == null) continue;
    const artists = (s.artists || [])
      .map((a) => a?.name)
      .filter(Boolean)
      .join('/');
    out.push({
      id: String(s.id),
      name: String(s.name || '未知'),
      artists,
      album: String(s.album?.name || ''),
      duration_ms: Number(s.duration) || 0,
    });
  }
  return out;
}
