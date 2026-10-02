---
name: erlin-web-warm-terminal-design
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

**设计令牌**

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--dcc-bg` | `#151412` | 页面底色（暖近黑） |
| `--dcc-panel` | `#1c1b19` | 面板/卡片底层 |
| `--dcc-raised` | `#25231f` | 卡片内容层 |
| `--dcc-ink` | `#f2eee7` | 主文字（暖奶油） |
| `--dcc-muted` | `#b3aca2` | 正文次级文字 |
| `--dcc-faint` | `#817a70` | 元数据/弱化文字 |
| `--dcc-line` | `#35322c` | hairline 边框与分隔线 |
| `--dcc-signal` | `#f08a64` | 唯一强调色（橙），eyebrow/按钮/激活态 |
| `--dcc-signal-soft` | `#3a251f` | 信号色的暗色晕染（focus ring/光点底圈） |
| `--dcc-on-signal` | `#211814` | 信号色之上的深色文字与按钮 |

**字体系统**

- **Display**：Space Grotesk（Google Fonts / `next/font/google`）。标题 weight 600–650，字距收紧到 `-0.06em ~ -0.085em`，行高 `0.91 ~ 0.96`，`text-wrap: balance`，并用 `max-width` 的 ch 值控制断行（h1 约 11ch，卡片标题约 16ch）——大而紧、敢压行，是排版的张力来源。
- **Metadata**：JetBrains Mono。只用于 eyebrow 标签、编号、状态行、版本号、footer：`0.55 ~ 0.7rem`、大写、`letter-spacing 0.08 ~ 0.13em`。eyebrow 一律用 signal 色。
- **正文/中文**：系统 sans 栈（中文自然回退苹方/思源黑），`0.76 ~ 1.18rem`，行高 `1.55 ~ 1.7`，用 `--dcc-muted` 色，`text-wrap: pretty`。
- 层级 = 字号对比 + 字重对比 + mono/sans 声部对比。不用装饰字体。

**布局语法**

- **容器**：`width: min(100% - 3rem, 1280px); margin-inline: auto`（移动端收窄到 `100% - 2rem`）。
- **分节靠 hairline**：章节之间用 `border-top: 1px solid var(--dcc-line)` 分隔，`padding-block: clamp(4rem, 8vw, 8rem)`。不用大色块分段。
- **hero**：左右不对称双栏 grid（约 `0.85fr / 1.15fr`，gap `clamp(3rem, 8vw, 8rem)`），左侧文案、右侧可交互产品演示卡（不是截图，是带状态切换的真组件）。
- **章节 intro 与内容再分栏**：如 `0.72fr / 1.28fr`（左小 intro + 右三步）、`0.65fr / 1fr`（左印章 + 右宣言）。
- **编号步骤**：3 列 grid，每项 `border-top` hairline + mono 橙色编号 `01/02/03`，标题下压 `margin-top: 4.5rem` 制造呼吸感。
- **背景坐标纸**：fixed 全屏 72px 网格线（奶油色 3% 透明度，1px），底部用 mask 渐隐。内容 `z-index: 1` 抬到网格上。

**组件配方**

**按钮**

- 主按钮：signal 实底 + `#211814` 文字，radius `0.6rem`，`min-height 2.8rem`，字号 `0.8rem`/weight 650，尾部带箭头字形 `<span>↗</span>`；hover 换 `#ff9b72` + `translateY(-2px)`。
- 次按钮：透明底、muted 文字，hover 变 ink 并同样上浮。
- 导航 CTA：hairline 边框，hover 换 signal 边框 + signal-soft 底。
- 胶囊小按钮（重播/刷新类）：`border-radius: 999px` + hairline 边框。

**卡片**

- 外层 radius `1rem`、内层 `0.7rem`，hairline 边框，panel/raised 实底（不用玻璃拟态）。
- 阴影极克制：整页最多一处大软阴影（hero 卡 `0 2rem 5rem rgb(0 0 0 / 22%)`），其余靠边框。
- 激活态 = signal 边框 + `0 0 0 0.2rem var(--dcc-signal-soft)` 外圈 + `translateY(-0.2rem)`，220ms。
- 装饰：卡片右下角外溢一个 `5rem` 的 signal 圆环（opacity 0.4）。

**终端面板细节**：卡片顶部一条 mono 状态行（下 hairline 分隔）：左管道标签（`SOURCE → VOICE → DRAFT`），右状态文字 + 胶囊按钮 + 信号点（`0.45rem` 圆点外套 `0.3rem` signal-soft 光环）。骨架占位用圆角条（88% signal / 62% line / 74% line）。版本号用 mono 描边小 chip，激活时填充 signal。

**CTA 横幅（反色段）**：整块 signal 实底、`#211814` 文字、radius `1rem`、`align-items: end` 的两端布局；按钮反转为 `#211814` 底 + ink 文字。这是全页唯一的"满色块"时刻，放在结尾做收束。

**印章元素**：大号 signal 描边圆环（`clamp(7rem, 15vw, 12rem)`）内放一个超大字母，旁边竖排 mono 小字（如 `KEEP / THE / THREAD`）。每页至多一处。

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
