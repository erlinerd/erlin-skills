---
name: erlin-web-warm-terminal-design
maturity: productivity
description: Apply or fully replicate the "Warm Terminal" style — warm dark dev-tool terminal aesthetic. Use when the user names this style, asks to replicate/复刻 the personOS landing page, wants a dark landing page / dark dev-tool UI / 瑞士网格排版 / 终端风 / Linear-Vercel 式暗色页面, or a promo landing page (推广页/产品官网首页) in this style — even if they just say "用那个暗色风格" or "做成 personOS 首页那样".
when_to_use: 应用或完整复刻 Warm Terminal 暖色暗终端风格——暗色落地页/暗色 dev-tool UI/瑞士网格排版/推广页官网时使用；用户点名该风格、要复刻 personOS 式落地页、或说"用那个暗色风格"即触发。
keywords:
  - Warm Terminal
  - 暖色终端风
  - 终端风官网
  - 瑞士网格排版
  - 暗色落地页
  - dark landing page
  - dark dev-tool UI
  - 推广页
  - 官网设计
  - personOS 首页
---

# 目标

一种「瑞士国际主义排版 × 开发者工具终端美学」的暖色暗风格（Warm Terminal），配一套推广页话术；用于应用或完整复刻此类暗色落地页 / dev-tool UI / 推广页官网。四个支柱缺一不可：

1. **暖色暗底**：炭底 + 奶油墨色 + 单一橙色信号色。刻意避开冷蓝灰暗色——所有颜色都往暖里调，这是这个风格区别于"千篇一律 Linear 克隆"的关键。
2. **瑞士网格排版**：背景铺坐标纸网格，hairline 细线分节，大写字距 mono 标签引导章节，编号（01/02/03）与排印箭头（↗ ↓ ↳）做装饰，靠字号字重对比（而非衬线或插画）建立层级。
3. **终端气质**：等宽字体承载元数据和状态行，卡片像终端面板，主按钮是纯色块 + 箭头字形。
4. **推广页话术**：整页是一场六步说服——品类声明 →「从 X 到 Y」转化承诺 → 演示机制 →「怎么工作」→「为什么是 XX」→ 行动收束。导航链接直接叫「XX 怎么工作」「为什么是 XX」，短陈述句、句号收尾、零感叹号。句式公式见 `references/copywriting.md`。

# 执行步骤

1. **确认模式**：用户要求"复刻/照做/几乎一样" → 走复刻模式（第 3 步）；其余 → 常规套用（第 2 步）。
2. **常规套用（非复刻的常规套用）**：
   1. 引入字体：Space Grotesk + JetBrains Mono（Next.js 用 `next/font/google` 挂 CSS 变量），并确保 `html { scroll-behavior: smooth }`。
   2. 把 `references/tokens.css` 的令牌与组件 pattern 粘进全局样式（Tailwind v4 项目则映射进 `@theme`）——应用到新项目时先读它。
   3. 按布局语法搭骨架：nav（hairline 底边）→ split hero → 编号三步 → 宣言/印章 → 反色 CTA → mono footer。
   4. 自查：是否只有 signal 一个彩色？分节是否全是 hairline？装饰是否只有箭头/编号/圆环/网格？有任何渐变装饰、玻璃拟态、冷色 → 违反契约，改掉。
3. **复刻模式（目标：复刻出几乎一样的网站）**：按顺序读齐五个参考文件再动手，不要凭本文件的记忆写：
   1. `references/page-blueprint.md` — 逐节布局蓝图：全局骨架、每节的 grid/尺寸/断行/ch 值、内容槽清单、跨栈移植规则。
   2. `references/copywriting.md` — 推广页话术：六步说服骨架、「XX 怎么工作 / 为什么是 XX」命名公式、逐槽句式表、语气红线、5 条文案自查。
   3. `references/interactions.md` — 交互规格：演示状态机（0→1→2→3→0）、语言切换、hover/过渡清单（180/220ms）、aria 契约、响应式联动、7 条行为自查。
   4. `references/tokens.css` — 完整样式表，类名与骨架一一对应，直接粘贴。
   5. `references/page-skeleton.tsx` — React 客户端组件骨架：结构 + 状态机 + 双语文案字典，SLOT 注释标记全部可替换内容。

   复刻完成后必须走三份自查清单：`interactions.md` 第 7 节（行为）+ `copywriting.md` 第 5 节（文案）+ 常规套用第 4 步（视觉）。

# 判断规则

- **触发**：用户点名该风格、要复刻 personOS 式落地页、要暗色落地页 / 暗色 dev-tool UI / 瑞士网格排版 / 终端风 / Linear-Vercel 式暗色页面、或该风格的推广页（推广页/产品官网首页）——即使用户只说"用那个暗色风格"或"做成 personOS 首页那样"。
- **模式分支**：用户要求"复刻/照做/几乎一样" → 复刻模式（先读齐五个参考文件）；其余 → 常规套用。
- **色彩方向**：所有颜色向暖偏移，禁止引入冷蓝/冷灰。
- **单强调色纪律**：整页只有 signal 一个彩色。需要区分层级时用亮度（ink → muted → faint），不引入第二个色相。

# 输出格式

产出页面必须遵循以下规格（完整可直接粘贴的 CSS 见 `references/tokens.css`）。

设计令牌、字体系统、布局语法与组件配方的**唯一事实源是 `references/tokens.css`**（完整可粘贴，类名与 page-skeleton.tsx 一一对应）——本文件不复述具体值，套用前先读它；逐节尺寸与断行规格见 `references/page-blueprint.md`。

**动效与可及性**

- 只做 180–220ms ease 的颜色/位移过渡和 hover 上浮。不搞入场大动画、视差、发光。
- focus-visible：`2px solid var(--dcc-signal)`、offset `4px`。
- 必须带 `prefers-reduced-motion: reduce` 全局降级块。
- 对比度：muted on bg ≈ 8:1，faint 只用于装饰性元数据，不承载关键信息。

**响应式**

- ≤900px：hero 折单栏。
- ≤700px：全单栏；导航只留 CTA（隐藏普通链接）；h1 用 `clamp(3.1rem, 15vw, 5rem)`；三步折一列；CTA 横幅改纵向。

# 示例

## 用户问题

"帮我们产品做个推广页，做成 personOS 首页那样的暗色风格。"

## 工具返回

### references/tokens.css

返回完整可直接粘贴的 CSS：全部 `--dcc-*` 令牌 + 按钮/卡片/终端面板组件 pattern，类名与骨架一一对应。

### references/page-skeleton.tsx

返回 React 客户端组件骨架：结构 + 演示状态机（0→1→2→3→0）+ 双语文案字典，SLOT 注释标记全部可替换内容。

## 最终输出

一个 Warm Terminal 风格推广页：nav（hairline 底边）→ split hero（左文案 + 右真组件演示卡）→ 编号三步 → 宣言/印章 → 反色 CTA 横幅 → mono footer；全页只有 signal 一个彩色、分节全 hairline、背景坐标纸网格；视觉自查四问全过（复刻模式另须三份自查清单全过）。

# 门禁

- 四个支柱缺一不可；自查四问有任何一项不过（渐变装饰、玻璃拟态、冷色、非 hairline 分节）→ 违反契约，改掉。
- 所有颜色向暖偏移，禁止引入冷蓝/冷灰；整页只有 signal 一个彩色，层级用亮度不引入第二色相。
- 动效克制：只做 180–220ms ease 过渡与 hover 上浮，不搞入场大动画、视差、发光；必须带 `prefers-reduced-motion: reduce` 全局降级块；faint 不承载关键信息。
- 装饰配额：整页最多一处大软阴影；印章元素每页至多一处。
- 复刻模式：必须按顺序读齐五个参考文件再动手，不凭本文件记忆写；复刻完成后必须走三份自查清单（行为 + 文案 + 视觉）。
