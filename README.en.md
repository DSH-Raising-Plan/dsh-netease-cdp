# dsh-netease-cdp

Drive the **NetEase Cloud Music** desktop client through the **Chrome DevTools Protocol (CDP)** — packaged as [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **playback tools**.

CDP controls the window you are **already logged in** to (member library, personal radar). Keyword search uses the public web API — **no cookies, no private login APIs**.

> Community plugin. Not affiliated with DeepSeek or NetEase.  
> Port of [`canyueY/netease-cdp`](https://github.com/canyueY/netease-cdp).  
> Chinese docs: [README.md](./README.md)

## Why CDP

NetEase's private API needs login state, signatures and frequently changing crypto parameters — high maintenance. CDP takes a different path:

- The client is already logged in, so member library, personal radar and daily recommendations are available;
- Read playback state and dispatch playback actions over the debug port, equivalent to “clicking for the user”;
- Search the public web API for song IDs, then hand playback to the client;
- No password storage, no login endpoint.

## Prerequisite: start the client with the debug port

```bat
"C:\Program Files\Netease\CloudMusic\cloudmusic.exe" --remote-debugging-port=9222
```

The debug port only works as a **process start argument**; it cannot be enabled on a running process. Fully quit and restart the client after changing it.

## Install

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-netease-cdp#plugin/dsh
```

For local development, install dependencies first (`ws`):

```bash
npm ci
npm test
```

## Tools

| Tool | Arguments | Purpose |
| --- | --- | --- |
| `netease_probe` | `port?` | Is CDP reachable? Also returns the current track |
| `netease_now_playing` | `port?` | Read the current track |
| `netease_search` | `keyword` (required), `limit` (1–20) | Search candidates (id/name/artists); does not play |
| `netease_play` | `song_id` (required), `force?` | Play by song ID (`force` re-dispatches the same track) |
| `netease_play_keyword` | `keyword` (required), `index?`, `limit?` | Search and play the Nth candidate |
| `netease_insert_next` | `song_id` (required) | Insert as “play next” without interrupting |
| `netease_play_card` | `card` | Discover card: `daily` / `private_radar` / `heart_mode` / `private_roam` |
| `netease_next` | `dom_fallback?` | Next track (falls back to clicking the DOM) |
| `netease_prev` | `dom_fallback?` | Previous track |

Also exposes `ctx.netease` for other plugins.

## Configuration

Port precedence: tool `port` > `ctx.config['dsh-netease-cdp'].port` > `NETEASE_CDP_PORT` > `9222`.

```json
{
  "dsh-netease-cdp": { "port": 9222 }
}
```

## Examples

```text
netease_probe                              → client online? what's playing?
netease_play_keyword {"keyword":"夜航星"}   → search and play the first hit
netease_play {"song_id":"1234567"}          → play an exact song ID
netease_insert_next {"song_id":"1234567"}   → queue next
netease_play_card {"card":"private_radar"}  → play the personal radar
```

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `cannot connect to CDP port 9222` | Client was not started with `--remote-debugging-port=9222`; fully quit and restart |
| `no usable page` | Client has not finished loading; wait and probe again |
| `Cannot find package 'ws'` | Run `npm ci` inside the plugin directory |
| Search works but playback does not | Not logged in / member-only track / page structure changed; run `netease_probe` first |
| Skip is flaky | The client may have changed its Redux path; `netease_next` falls back to DOM clicks |

## Limitations

- Only the **desktop client**, not the web player;
- Search uses a public web API and may break when the site changes;
- No cookie access, so account-only data (e.g. private FM reasons) is unavailable;
- Client updates can change internal page structure and require selector fixes;
- Playback is “dispatch an action”; copyright/region restrictions can still block it.

## Development

```bash
npm ci
npm test
npm run check
```

Requires `@deepseek-ai/dsh-tools` (or `DSH_TOOLS_PATH`) to register tools.

## License

AGPL-3.0-or-later
