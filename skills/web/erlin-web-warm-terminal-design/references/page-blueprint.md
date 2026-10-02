# Warm Terminal — 页面布局蓝图

参考站（personOS landing）的逐节解剖。数值单位 rem（1rem = 16px）。所有类名与 `tokens.css` 对应；行为见 `interactions.md`；React 实现见 `page-skeleton.tsx`（其他栈按本蓝图等价翻译）。

## 全局骨架

```
<main class="dcc" lang>                      ← 页面根：底色/网格背景/字体栈
  <header class="dcc-container"> nav        ← 顶栏（不占 dcc-section 节奏）
  <section class="dcc-container"> hero      ← 无 border-top（首屏）
  <section class="dcc-container" id=how>    ← dcc-section + dcc-how 双栏
  <section class="dcc-container" id=why>    ← dcc-section + dcc-why 双栏
  <section class="dcc-container"> CTA band  ← 无 dcc-section（紧接 why 的 padding）
  <footer class="dcc-container"> footer
```

- 每节内容都套 `dcc-container`（`min(100% - 3rem, 1280px)` 居中）；移动端改 `100% - 2rem`。
- 节与节之间只用 `border-top: 1px solid var(--dcc-line)` 分隔（CTA 横幅除外——它自带满色块）。
- 分节 padding `clamp(4rem, 8vw, 8rem)`；how 节略收为 `clamp(4rem, 8vw, 7rem)`。

## 1. 顶栏（dcc-nav）

flex 两端布局，min-height 5rem，底边 hairline：

- **Wordmark**（左）：signal 方 chip（2.25rem、radius 0.7rem、单个**小写**品牌字母 1.3rem/700/-0.12em）+ 双行文字堆（strong 品牌名 1rem/-0.04em；small 类别说明 mono 0.57rem 大写 faint）。
- **右侧组**：2 个锚点链接（0.76rem muted）+ 语言切换文字按钮 + CTA 描边按钮（radius 0.55rem）。

## 2. Hero（dcc-hero）

- 双栏 grid：`minmax(0, 0.85fr) | minmax(31rem, 1.15fr)`，gap `clamp(3rem, 8vw, 8rem)`，垂直居中，min-height 43rem，padding-block `clamp(4.5rem, 9vw, 8rem)`。
- **左栏**（max-width 36rem）自上而下：eyebrow（mono 橙大写）→ h1（**≤11ch 断行**、clamp(3.5→6.7rem)、650/-0.085/行高 0.91）→ intro（≤34rem）→ 按钮排（主：signal 实底 + ↗；次：幽灵 + ↓，尾字形 1.05rem）→ proof 行（mono 0.65rem faint，margin-top 2.8rem）。
- **右栏 = 演示面板**（dcc-demo），复刻的灵魂：
  - 外壳：panel 底、radius 1rem、hairline 边框、全页唯一大软阴影；右下角外溢 5rem signal 圆环（opacity 0.4）。
  - 顶部状态行（hairline 下边）：左 = 管道 eyebrow（`SOURCE → VOICE → DRAFT`，注意箭头两侧双空格）；右 = 状态文字（aria-live）+ 胶囊按钮（↻）+ 信号点（0.45rem 圆 + 0.3rem soft 光环）。
  - 中部 grid `1fr | 2rem | 1fr`：源卡片 + `+` 圆环连接符 + 口吻卡片；卡片 min-height 13.6rem、radius 0.7rem、raised 底。源卡片 = label + 标题（≤16ch）+ meta 行 + 右下角 ↗；口吻卡片 = label + 口吻名（≤11ch）+ 三条骨架条（88% signal / 62% line / 74% line）。
  - 底部全宽成稿卡片：**用页面底色（比面板更深一档）**，flex 左文右版本 chip（mono 描边小 chip）。
- ≤900px 折单栏（面板落到文案下、max-width 46rem）；≤700px 面板内部也折单列。

## 3. How（dcc-how，id=how）

- 双栏 `minmax(16rem, 0.72fr) | minmax(0, 1.28fr)`：左窄栏 intro（eyebrow + h2 + 正文，容器 max-width 24rem），右宽栏 = 三步列表。
- **三步列表**（dcc-steps，3 列 gap 1rem）：每项顶部 hairline + padding-top 1rem；mono 橙编号 `01/02/03`（0.7rem）→ h3（1.05rem/600，**margin-top 4.5rem 制造大呼吸**）→ 说明（0.82rem muted）。

## 4. Why（dcc-why，id=why）

- 双栏 `minmax(12rem, 0.65fr) | minmax(0, 1fr)`，垂直居中，gap 上限收到 9vw。
- **左 = 印章**（dcc-stamp，aria-hidden 纯装饰）：signal 描边大圆（clamp(7→12rem)）内一个超大品牌字母（clamp(4→8rem)/650/-0.16em）+ 旁边竖排三行 mono 小字（0.55rem 大写 faint，如 KEEP/THE/THREAD）。
- **右 = 宣言**（max-width 40rem）：eyebrow + h2 + 正文 + `↳` 清单（3 条，橙箭头 + ink 0.84rem，gap 0.85rem）。

## 5. CTA 横幅（dcc-cta）

- 整块 signal 满色底、radius 1rem、深色文字，flex 两端、**align-items: end**，padding `clamp(2rem, 5vw, 4.5rem)`。
- 左：eyebrow（`BRAND / 01` 编号模式，深色）→ h2（≤11ch）→ 正文（≤34rem），全部 `#211814`。
- 右：深底反色按钮（on-signal 底 + ink 文字，hover `#30251f`）。
- 全页唯一的满色块时刻，必须放结尾收束；除它之外不允许出现大面积彩色。

## 6. Footer（dcc-footer）

- flex 两端，min-height 7rem，整行 mono 0.62rem faint。
- 左：`© 2026 品牌名. 一句话定位`；右：语言标签 + 工作台链接（muted，hover ink）。

## 内容槽清单（换品牌时逐项替换）

wordmark 字母与品牌名/类别小字、eyebrow、h1、intro、两个 CTA 文案、proof、演示面板全套（管道 eyebrow、4 条状态文案、源/口吻/成稿三卡内容、版本号）、三步（编号不变）、宣言组、印章字母 + 三行小字、3 条 ↳ 主张、CTA 三件套、footer 定位句。**中文文案不是英文的直译腔，按参考站语气写短句。** 每个槽"怎么说话"（句式公式、语气红线）见 `copywriting.md`。

## 移植到其他栈

tokens.css 是纯 CSS（含嵌套前的普通选择器），可直接用于任何栈；Tailwind v4 项目把 `:root` 变量映射进 `@theme`，布局值按本蓝图写进工具类；关键是**数值不得四舍五入**——`11ch`、`0.91`、`4.5rem`、`13.6rem` 这些奇数承载了风格的节奏。
