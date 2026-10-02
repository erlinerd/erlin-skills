---
name: erlin-web-wechat-download
description: 给有 App Store 下载链接的官网做微信内跳转兼容——检测 MicroMessenger webview，拦截下载按钮并提示用户在 Safari 打开。仅在请求涉及微信/WeChat 与官网或 App Store 下载链接时使用。
when_to_use: 给带 App Store 下载链接的官网做微信内跳转兼容——检测 MicroMessenger webview、拦截下载按钮并引导用户在 Safari 打开时使用；请求涉及微信/WeChat 与官网下载链接时触发。
keywords:
  - 微信
  - MicroMessenger
  - WeChat
context_keywords:
  - 官网
  - App Store
  - 下载链接
---

# 目标

给有 App Store 下载链接的官网做微信内跳转兼容。微信内置浏览器（webview）屏蔽 `apps.apple.com` 跳转，用户在微信里点「在 App Store 下载」会毫无反应——这是国内 iOS 独立开发者官网的必踩问题。没有"绕过"方案（Apple 不提供 webview 内跳商店的合法通道），标准做法是检测微信 UA → 拦截点击 → 弹浮层引导用户点右上角「···」在 Safari 打开。实现参考可来自任意 Next.js/React 官网；模板组件见本技能的 `assets/wechat-guard.tsx`（若存在）。

# 执行步骤

1. **确认跳转入口统一**：所有 App Store CTA 必须走一处（如 shared `Pressable`/`DownloadButton`），只在这一处加拦截。散落多个 `<a href>` 的站点先收敛入口。
2. **UA 检测 + 拦截**（引用层）：

   ```tsx
   onClick={(e) => {
     if (typeof navigator !== 'undefined' && navigator.userAgent.includes('MicroMessenger')) {
       e.preventDefault()
       window.dispatchEvent(new Event('erlin:wechat-open')) // 与 WeChatGuard 的默认事件名一致
     }
   }}
   ```

   React 合成事件里 `preventDefault()` 对 `<a>` 导航有效；SSR 里 `navigator` 只在事件回调（客户端）访问，天然安全。
3. **实现闪层组件**（模板 `assets/wechat-guard.tsx`）：
   - 默认监听 `erlin:wechat-open`；若项目需要自定义事件名，CTA 和 `<WeChatGuard eventName="..." />` 必须使用同一个值；按 `pathname.startsWith('/en')` 决定中/英文案
   - 挂到**页面根**（server component 可挂 client 子组件）；初始 `visible=false`，SSR 零渲染、不拖 SEO
   - 浮层：半透明遮罩 + 右上角箭头图标 + 标题/正文 + 「知道了」关闭；`stopPropagation` 防点卡片误关
   - 样式沿用当前站点已有品牌 token；不要复制示例项目的颜色变量或语言文案
4. **文案**（中文站/双语站）：
   - 中：「微信内无法跳转 App Store。点击右上角「···」，选择「在 Safari 中打开」。」
   - 英：「The App Store link cannot open inside WeChat. Tap the "···" menu at the top right and choose "Open in Safari".」
5. **验证**：
   - 构建后确认逻辑进了**客户端 bundle**：`grep -rl "MicroMessenger\|wechat-open" .next/static/`（Next 16/turbopack 下 client 组件**不进 SSR HTML**，搜 HTML 会空——别误判"没上线"）
   - 真机/微信实测为最终裁决：微信里转发链接点下载按钮 → 应弹浮层而非死链接

# 判断规则

- **何时使用**：官网有任何 `apps.apple.com` 下载链接（App Store CTA 按钮）且面向国内用户；用户问"微信里打不开商店链接"/"微信兼容"/"引导 Safari 打开"；新建官网或翻新官网时。
- **判断是否缺少此兼容**：在微信里转发官网链接给任何人点下载，若能直接跳 App Store——通常说明已经做了；跳不过去就是要做的信号。不测就默认要做。
- **事件名约定**：加前缀（默认 `erlin:wechat-open`），裸 `wechat-open` 可能与站点其它脚本撞；CTA 与 `<WeChatGuard eventName="..." />` 必须同值。
- **语言判断放在组件边界**：浮层文案只此一处、且跨页面固定，可在组件内用 `pathname` 判语言；按当前项目的路由约定调整，不复制示例项目的 i18n 结构。
- **浮层轻重**：用户在微信内要看的就是一句"咋打开"——浮层越轻越好；箭头指示右上角是记忆点。
- **相关技能**：`erlin-app-store-compliance`（多语言文案流程）。

# 输出格式

- 一个 `WeChatGuard` 浮层组件：初始 `visible=false`（SSR 零渲染、不拖 SEO）；浮层 = 半透明遮罩 + 右上角箭头图标 + 标题/正文 + 「知道了」关闭按钮，`stopPropagation` 防点卡片误关。
- 中英文案各一条（跨页面固定，只此一处）：
  - 中：「微信内无法跳转 App Store。点击右上角「···」，选择「在 Safari 中打开」。」
  - 英：「The App Store link cannot open inside WeChat. Tap the "···" menu at the top right and choose "Open in Safari".」
- 统一入口 CTA 上的 `MicroMessenger` UA 检测拦截，派发 `erlin:wechat-open` 事件。

# 示例

## 用户问题

"官网在微信里点『App Store 下载』没反应，帮我兼容一下。"

## 工具返回

### grep

`grep -rl "MicroMessenger\|wechat-open" .next/static/` 列出包含微信检测逻辑的 chunk 文件——确认代码已进客户端 bundle（注意：搜 SSR HTML 会是空的，Next 16/turbopack 下 client 组件不进 SSR HTML）。

## 最终输出

页面根挂 `WeChatGuard` + 统一入口 CTA 的 UA 拦截 + 中英双语浮层文案；微信里点下载按钮弹出「在 Safari 中打开」引导浮层而非死链接，官网 SEO 不受影响。

# 门禁

- **无绕过**：别试图 `window.location`/iframe/mask 链接强制跳商店，微信全堵；引导 Safari 是唯一体面路径。
- 事件名必须带前缀（默认 `erlin:wechat-open`），CTA 与 Guard 必须同值。
- 浮层初始 `visible=false`，SSR 零渲染、不拖 SEO；样式沿用当前站点品牌 token，不复制示例项目的颜色变量或语言文案。
- 验证必须 `grep .next/static/` 全目录（别搜 SSR HTML 误判"没上线"）；`grep ... | head && echo ✓` 会假阳性（head 退出码恒 0），`&&` 别接在管道后判成功。
- 真机/微信实测为最终裁决：点下载应弹浮层而非死链接。
