# erlin-web-motion

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

为 Next.js/React 站点引入 motion 动效库、从 framer-motion 迁移导入，并铺设滚动揭示、stagger 网格、页面过渡、导航动效。不负责 SwiftUI、CSS-only 或 Remotion 视频动画。用户提到 Next.js/React 与 motion、framer-motion、滚动揭示、页面过渡或卡片动画时使用。

## When to reach for it

给 Next.js/React 站点引入 motion 动效库、从 framer-motion 迁移导入、或铺设滚动揭示/stagger 网格/页面过渡/导航动效时使用；提及"滚动揭示/页面过渡/卡片动画"即触发。

## Common questions

- **从 framer-motion 迁移要改什么？**

  导入源换成 motion/react，API 兼容，滚动揭示/stagger/页面过渡模式内置。

## It's working if

- 页面出现滚动揭示、stagger 网格、页面过渡等目标动效，且在真机/浏览器流畅运行。
- framer-motion 迁移后 import 全部来自 motion/react，构建无报错。
- 不该动的部分没被波及：SwiftUI、CSS-only、Remotion 视频不在它的改动范围。
