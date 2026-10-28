# dsh-netease-cdp

Drive the **NetEase Cloud Music** desktop client via Chrome DevTools Protocol — as [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) tools.

CDP talks to the already-logged-in Electron window. Keyword search uses the public web API (no cookies / private login APIs).

> Community plugin. Not affiliated with DeepSeek or NetEase.  
> Port of [`canyueY/netease-cdp`](https://github.com/canyueY/netease-cdp).  
> Chinese docs: [README.md](./README.md)

## Prerequisite

```bat
"C:\Program Files\Netease\CloudMusic\cloudmusic.exe" --remote-debugging-port=9222
```

## Install

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-netease-cdp#plugin/dsh
```

## Tools

| Tool | Purpose |
| --- | --- |
| `netease_probe` | CDP reachable? + current track |
| `netease_now_playing` | Current track |
| `netease_search` | Keyword search (public API) |
| `netease_play` | Play by song id |
| `netease_play_keyword` | Search and play first hit |
| `netease_insert_next` | Insert as next |
| `netease_play_card` | Play discover card |
| `netease_next` / `netease_prev` | Skip tracks |

## License

AGPL-3.0-or-later
