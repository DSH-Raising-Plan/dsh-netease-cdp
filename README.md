# dsh-netease-cdp

用 **Chrome DevTools Protocol（CDP）** 驱动网易云桌面客户端，做成 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) **点歌**工具。

CDP 控制的是你**已经登录**的客户端窗口（会员曲库 / 私人雷达跟你本机会话走）；关键词搜索走公开 web 接口，**不读 cookie、不碰私有登录 API**。

> 社区插件，与 DeepSeek / 网易云官方无关。  
> 移植自 [`canyueY/netease-cdp`](https://github.com/canyueY/netease-cdp)。  
> 英文简版：[README.en.md](./README.en.md)

## 为什么用 CDP

网易云的私有 API 需要登录态、签名和频繁变动的加密参数，维护成本高。CDP 走的是另一条路：

- 客户端本来就登录着，**会员曲库、私人雷达、每日推荐都在**；
- 通过调试端口读播放器状态、派发播放动作，等价于“替用户点了一下”；
- 搜索用公开 web 接口拿 song id，再交给客户端播放；
- 不保存账号密码，不调用登录接口。

## 前提：客户端必须带调试端口启动

```bat
"C:\Program Files\Netease\CloudMusic\cloudmusic.exe" --remote-debugging-port=9222
```

调试端口只在**进程启动参数**里生效，运行中改不了。改完要完全退出客户端再开。

## 安装

```bash
dsh plugin --profile web add github:DSH-Raising-Plan/dsh-netease-cdp#plugin/dsh
```

本地开发需要先装依赖（`ws`）：

```bash
npm ci
npm test
```

## 工具

| 工具 | 参数 | 作用 |
| --- | --- | --- |
| `netease_probe` | `port?` | 探测 CDP 是否可用，并返回当前曲目 |
| `netease_now_playing` | `port?` | 读取当前曲目 |
| `netease_search` | `keyword`（必填）、`limit`（1–20） | 搜索候选（id/name/artists），不播放 |
| `netease_play` | `song_id`（必填）、`force?` | 按 song id 点播（`force` 用于同一首强制重派发） |
| `netease_play_keyword` | `keyword`（必填）、`index?`、`limit?` | 搜索并点播第 N 个候选 |
| `netease_insert_next` | `song_id`（必填） | 插到“下一首播放”，不打断当前曲 |
| `netease_play_card` | `card` | 播放发现页卡片：`daily` / `private_radar` / `heart_mode` / `private_roam` |
| `netease_next` | `dom_fallback?` | 下一首（Redux 失败时默认点 DOM） |
| `netease_prev` | `dom_fallback?` | 上一首 |

插件还会在 `ctx.netease` 上挂搜索/点播能力，供其它插件复用。

## 配置

端口优先级：工具参数 `port` > `ctx.config['dsh-netease-cdp'].port` > 环境变量 `NETEASE_CDP_PORT` > `9222`。

```json
{
  "dsh-netease-cdp": { "port": 9222 }
}
```

## 使用示例

```text
netease_probe                       → 客户端在线？现在在放什么？
netease_play_keyword {"keyword":"夜航星"}  → 搜索并播放第一首
netease_play {"song_id":"1234567"}         → 精确点播
netease_insert_next {"song_id":"1234567"}  → 插队到下一首
netease_play_card {"card":"private_radar"} → 播放私人雷达
```

## 故障排查

| 现象 | 原因 / 处理 |
| --- | --- |
| `连不上 CDP 端口 9222` | 客户端没带 `--remote-debugging-port=9222` 启动，完全退出后重开 |
| `没有可用的 page` | 客户端还没加载完，等几秒再 probe |
| `Cannot find package 'ws'` | 在插件目录执行 `npm ci` |
| 搜索有结果但播放无效 | 客户端未登录 / 会员曲库受限 / 页面结构变化，先 `netease_probe` 看状态 |
| 切歌不稳定 | 新版客户端可能改 Redux 路径；`netease_next` 默认会回退点 DOM |

## 限制

- 只控制**桌面客户端**，不是网页版；
- 搜索接口是公开 web API，可能随站点改动失效；
- 不读 cookie，因此拿不到“私人 FM 推荐理由”之类的账号数据；
- 客户端更新可能改变内部页面结构，需要跟着修选择器；
- 点播是“派发动作”，不保证版权/地区限制下一定成功。

## 开发

```bash
npm ci
npm test
npm run check
```

需要 `@deepseek-ai/dsh-tools`（或设置 `DSH_TOOLS_PATH`）才能注册工具。

## 许可

AGPL-3.0-or-later
