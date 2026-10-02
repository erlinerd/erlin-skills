---
name: erlin-web-motion
description: 为 Next.js/React 站点引入 motion 动效库、从 framer-motion 迁移导入，并铺设滚动揭示、stagger 网格、页面过渡、导航动效。不负责 SwiftUI、CSS-only 或 Remotion 视频动画。用户提到 Next.js/React 与 motion、framer-motion、滚动揭示、页面过渡或卡片动画时使用。
when_to_use: 给 Next.js/React 站点引入 motion 动效库、从 framer-motion 迁移导入、或铺设滚动揭示/stagger 网格/页面过渡/导航动效时使用；提及"滚动揭示/页面过渡/卡片动画"即触发。
keywords:
  - Next.js 动效
  - React 动效
  - motion 库
  - framer-motion
  - 滚动揭示
  - 页面过渡
  - 卡片动画
---

# 目标

Erlin 的个人站动效方法论：给 Next.js/React 站点引入 motion 动效库、从 framer-motion 迁移导入、铺设滚动揭示 / stagger 网格 / 页面过渡 / 导航动效，同时**绝不让动效把内容搞丢**。核心教训：`whileInView` 曾让首页项目卡片卡在 `opacity:0`（"项目卡片没了"）。因此需要可见性兜底；已有可靠实现可保留，`Reveal` 是可选参考，不全面禁止 `whileInView`。

# 执行步骤

1. **先判断项目环境**（动手前花 30 秒确认，避免套错模板）：
   - **包管理器**：只认一个 lockfile：`pnpm-lock.yaml` → pnpm，`package-lock.json` → npm，`yarn.lock` → yarn，`bun.lock` 或 `bun.lockb` → bun。多个 lockfile 时停止并询问用户；没有 lockfile 时读取 `package.json` 的 `packageManager`，仍无法判断就停止，不猜包管理器。后续安装、迁移、lint、build 命令都跟随已确认的管理器。
   - **Next/React 版本**：检查实际 Next/React 与动画库版本、peer dependencies 和官方兼容说明，不硬编码版本或宣称跨版本 API 完全兼容。
   - **路由结构**：有 locale-prefixed 路由（`app/[locale]/` 目录）时，template 放 `app/[locale]/template.tsx`；**无 locale 路由**（如用 client 端语言切换）放 `app/template.tsx`，Next 同样每次导航重挂载，淡入照常生效。
   - **组件当前是否是 server 组件**：需要交互的 motion 元素隔离到最小 client 组件；不要直接把含服务器逻辑的整个组件改为 client。
2. **沿用现有依赖**：已有 `framer-motion` 且满足需求时继续使用，不因新增动效默认迁移。仅用户要求迁移或当前能力/兼容性确有必要时，检查版本差异后按项目包管理器安装 `motion`，逐处核实 `motion/react` 导入与 API；确认无残留依赖后再移除旧包。不顺手改无关注释或文档。

3. **铺设动效：按需参考 Reveal**：模板见 `assets/reveal.tsx`，复制到 `components/motion/reveal.tsx` 并适配路径别名。设计要点（按项目适配）：
   - **可见性兜底**：模板用 IntersectionObserver + 2.5s 超时；2.5s 只是参考参数，按页面与加载行为调整。可使用已验证的 whileInView 或其他机制，确保 observer、JS 或 hydration 失败时内容仍可访问。
   - 根据 SSR/hydration 与项目 lint 规则处理 reduced-motion 和 observer 缺失；避免 hydration 不一致及无必要的同步 effect 更新，不把一次 lint 经验当所有 API 的禁令。
   - reduced motion 直接渲染最终态。
   - 纯 CSS transition（`cubic-bezier(0.22,1,0.36,1)`），不用 motion.div，零动画运行时开销。
   - `Reveal` 自带 className prop：原本是 `div` 的卡片（如 `glass` 卡）直接把类名传给 Reveal，省一层嵌套；`article`/`section` 等有语义的元素用 Reveal 外包一层，保住语义。
4. **应用位置与 stagger 公式**：

   | 位置 | 做法 | delay |
   | --- | --- | --- |
   | 卡片网格（首页多个区块） | 每项包 `Reveal` | `Math.min(i * 0.08, 0.4)`，封顶防长网格拖沓 |
   | 文章列表（writing、latest-writing） | 每行包 `Reveal` | `i * 0.05~0.07`，封顶 `Math.min(i*0.05, 0.3)` 防长列表拖沓 |
   | 项目大图行的文字列 | `Reveal` | 固定 `0.15`，与图片视差错开 |
   | 正文/联系卡片（about） | 大块 `Reveal` | 第二块 `0.1` |
   | 导航栏 | `motion.header` 初始 `y:"-100%"` 滑入，滚动隐藏复用同一 transform | — |
   | 移动菜单 | `AnimatePresence` + `opacity/y` 过渡，替换 `block/hidden` 切换 | — |
   | 路由切换 | 新建 `app/template.tsx`（无 locale 路由）或 `app/[locale]/template.tsx`（locale-prefixed；Next 每次导航重挂载 template）做 `opacity+y` 淡入，0.35s | — |

5. **验证与交付**：按第 1 步确认的包管理器：

   ```sh
   pnpm lint && pnpm build      # pnpm 项目；全站 SSG 应保持成功
   npm run lint && npm run build  # npm 项目
   ```

   仅用户授权提交时，按项目提交惯例，例：`feat(motion): 迁移 motion 库并新增全站动效`。**只 add 本次任务相关文件**——仓库里若混有无关的未提交改动，不要顺手带进本次提交。

# 判断规则

- **何时使用**：给 Next.js 站点新增动效/动画；把 `framer-motion` 迁移到 `motion` 包（迁移前核对当前版本 API）；用户要求"滚动揭示""stagger""页面过渡""更多动效"。
- **不负责**：SwiftUI、CSS-only 或 Remotion 视频动画。
- **动效设计规则（踩坑总结）**：
  - **LCP 元素（H1、hero）不加入场动画**：`SkewReveal` 有 `instant` prop，或者初始态直接是最终态，否则 SSR 文本会闪烁。
  - **所有动效尊重 `prefers-reduced-motion`**：用 `useReducedMotion()`，reduced 时渲染最终态/不注册监听。
  - 统一缓动 `[0.22, 1, 0.36, 1]`（easeOutQuint 风格），时长 0.3–0.8s，克制优先。
  - 悬浮动效用 CSS transition 即可（如 `hover:-translate-y-1`、`group-hover:scale-105`），不必引 motion。
  - 客户端过滤（如 tag 筛选）时，key 不变的列表项不会重播动画——这是预期行为，新出现的项自动触发。
- **已有组件归属**：SkewReveal 入场、Parallax 视差、Magnetic 磁吸、MouseParallax 保留即可，新动效与它们同目录共存；若项目已有 `.zcode`/`.agents` 动效组件目录（如 `components/motion/`），新组件放同目录。
- **server/client 边界**：服务器组件可直接渲染 `Reveal`（它是 client 组件，作为子组件使用无碍）。

品味/方案决策 → `emil-design-eng`；RN/Expo 项目 → `animate`；动效完成前实际检查视觉、可及性与内容可见性；`review-animations` 仅用户显式调用；本技能管 Next.js/React 的 motion 实现技术。


# 输出格式

- `Reveal` 组件落位：从 `assets/reveal.tsx` 复制到 `components/motion/reveal.tsx` 并适配路径别名。
- 路由过渡：`app/template.tsx`（无 locale 路由）或 `app/[locale]/template.tsx`（locale-prefixed），`opacity+y` 淡入 0.35s。
- 提交信息：conventional commits + 中文描述，例：`feat(motion): 迁移 motion 库并新增全站动效`。

# 示例

## 用户问题

"给站点加滚动揭示，顺便把 framer-motion 换成 motion。"

## 工具返回

### pnpm

`pnpm add motion && pnpm remove framer-motion` 成功，`package.json` 里出现 兼容项目的 `motion` 版本；`pnpm lint && pnpm build` 全站 SSG 保持成功。

### sed

`sed -i '' 's/from "framer-motion"/from "motion\/react"/g' <files>` 执行后，所有导入指向 `motion/react`；仅更新本次迁移相关且确已过期的说明。

## 最终输出

`components/motion/reveal.tsx`（手动 IntersectionObserver + 2.5s 保险丝）+ 卡片/列表 stagger + `app/template.tsx` 路由淡入；lint、build 通过；报告实际验证；仅已有提交授权时提交本次相关文件。

# 门禁

- **内容红线**：绝不让动效把内容搞丢——验证 SSR、reduced-motion、observer/脚本异常时内容可访问；Reveal 与超时参数是参考实现，不机械禁用 API。
- **可及性红线**：所有动效尊重 `prefers-reduced-motion`；LCP 元素（H1、hero）不加入场动画。
- **验证**：按确认的包管理器跑 `lint && build`，全站 SSG 必须保持成功。
- **提交纪律**：只 add 本次任务相关文件，仓库里无关的未提交改动不顺手带进提交。
- **渐进增强**：不要动已经能工作的动效组件来"统一风格"，依据需求和可访问性证据判断。
