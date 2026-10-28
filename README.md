# dsh-netease-cdp

用 **Chrome DevTools Protocol（CDP）** 驱动网易云桌面客户端，做成 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **点歌**工具。

CDP 控制的是你**已经登录**的客户端窗口（会员曲库 / 私人雷达跟你本机会话走）；关键词搜索走公开 web 接口，**不读 cookie、不碰私有登录 API**。

> 社区插件，与 DeepSeek / 网易云官方无关。  
> 移植自 [`canyueY/netease-cdp`](https://github.com/canyueY/netease-cdp)。  
> 英文简版：[README.en.md](./README.en.md)

## 前提

启动客户端时带上调试端口（必须在进程启动参数里）：

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
| `netease_probe` | 探测 CDP 是否可用，并返回当前曲目 |
| `netease_now_playing` | 读取当前曲目 |
| `netease_search` | 按关键词搜索（公开接口，无需登录） |
| `netease_play` | 按 song id 点播 |
| `netease_play_keyword` | 搜索并点播第一首匹配 |
| `netease_insert_next` | 插到下一首 |
| `netease_play_card` | 发现页卡片点播 |
| `netease_next` / `netease_prev` | 切歌 |

插件还会挂 `ctx.netease`，方便其它插件复用搜索/点播。

## 开发

```bash
npm install
npm test
npm run check
```

需要 `@deepseek-ai/dsh-tools`（或设置 `DSH_TOOLS_PATH`）。

## 许可

AGPL-3.0-or-later
