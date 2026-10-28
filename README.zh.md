# dsh-netease-cdp · 中文说明

用 **Chrome DevTools Protocol** 驱动网易云桌面客户端，做成 DeepSeek Harness 点歌工具。

CDP 控制的是你已经登录好的客户端窗口；关键词搜索走公开 web 接口，不读 cookie、不碰私有登录 API。

> 社区插件。移植自 [`canyueY/netease-cdp`](https://github.com/canyueY/netease-cdp)。

## 前提

启动时带上调试端口：

```bat
"C:\Program Files\Netease\CloudMusic\cloudmusic.exe" --remote-debugging-port=9222
```

## 安装

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-netease-cdp#plugin/dsh
```

## 工具

| 工具 | 作用 |
| --- | --- |
| `netease_probe` | 探测 CDP + 当前曲目 |
| `netease_now_playing` | 当前曲目 |
| `netease_search` | 关键词搜索（公开接口） |
| `netease_play` | 按 song id 点播 |
| `netease_play_keyword` | 搜索并点播第一首 |
| `netease_insert_next` | 插到下一首 |
| `netease_play_card` | 发现页卡片点播 |
| `netease_next` / `netease_prev` | 切歌 |

## 许可

AGPL-3.0-or-later
