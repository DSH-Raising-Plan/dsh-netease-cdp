# dsh-netease-cdp

Drive the **NetEase Cloud Music** desktop client via Chrome DevTools Protocol — as [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) tools.

Does **not** call the HTTP API or read cookies. It talks to the already-logged-in Electron window, so VIP / private radar work with your own session.

> Community plugin. Not affiliated with DeepSeek or NetEase.  
> Port of [`canyueY/netease-cdp`](https://github.com/canyueY/netease-cdp).

## Prerequisite

Start CloudMusic with a debug port (must be at process launch):

```bat
"C:\Program Files\Netease\CloudMusic\cloudmusic.exe" --remote-debugging-port=9222
```

## Install

```bash
dsh plugin --profile web add github:canyueY/dsh-netease-cdp#plugin/dsh
```

## Tools

| Tool | Purpose |
| --- | --- |
| `netease_probe` | CDP reachable? + current track |
| `netease_now_playing` | Current track details |
| `netease_play` | Play by song id |
| `netease_next` / `netease_prev` | Skip tracks |

## License

AGPL-3.0-or-later
