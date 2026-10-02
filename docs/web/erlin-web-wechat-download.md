# erlin-web-wechat-download

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

给有 App Store 下载链接的官网做微信内跳转兼容——检测 MicroMessenger webview，拦截下载按钮并提示用户在 Safari 打开。仅在请求涉及微信/WeChat 与官网或 App Store 下载链接时使用。

## When to reach for it

给带 App Store 下载链接的官网做微信内跳转兼容——检测 MicroMessenger webview、拦截下载按钮并引导用户在 Safari 打开时使用；请求涉及微信/WeChat 与官网下载链接时触发。

## Common questions

- **为什么要特殊处理？**

  微信内置浏览器拦截 App Store 跳转；需检测 MicroMessenger 并提示用户在 Safari 打开。

## It's working if

- 在微信内置浏览器打开官网：下载按钮被拦截并提示"在 Safari 打开"，而不是点了没反应。
- Safari 或其他浏览器打开同一页面时，下载链接行为不受影响。
- MicroMessenger 检测不影响页面其余功能。
