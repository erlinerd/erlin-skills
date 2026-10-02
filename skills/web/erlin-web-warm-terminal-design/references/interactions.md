# Warm Terminal — 交互规格

复刻参考站（personOS landing）的全部行为。与 `page-skeleton.tsx` 对应；改品牌时保留行为，只换文案槽。

## 1. 演示状态机（hero 右侧面板的核心交互）

单按钮手动推进的状态机，**不是自动轮播**：

```
state: 0 → 1 → 2 → 3 → 0（循环），由唯一一个按钮触发
```

| stage | 激活的元素（`data-active='true'`） | 状态行文案（aria-live 区） | 附加效果 |
| --- | --- | --- | --- |
| 0（初始） | 无 | "看一条素材如何变成可发布的成稿。" | 按钮文案 = "播放示例" |
| 1 | 源卡片 | "素材已带入。" | — |
| 2 | 口吻卡片 + 中间 `+` 连接符（scale 1.12） | "口吻预设已应用。" | — |
| 3 | 成稿卡片 | "示例成稿已准备好，不需要注册。" | 版本 chip 从描边变实底（`.dcc-demo[data-stage='3'] .dcc-chip`）；**所有 CTA 的 href 追加 `?demo=1`** |

规则：

- 推进逻辑：`next = stage === 3 ? 0 : stage + 1`——第 3 次点击后回到初始态，形成可无限重看的循环。
- 按钮的 `aria-label` 随状态切换：stage 0 为 "Play sample workflow"，其余为 "Replay sample workflow"；可见文案同步换（播放示例 ↔ 重新播放）。
- 状态行必须是 `aria-live="polite"`，每次推进屏幕阅读器播报新状态。
- 埋点钩子（可选，复刻时至少留注释位）：页面加载 `landing_view`；离开 stage 0 时 `demo_started`；到达 stage 3 时 `demo_completed`。
- 卡片激活态视觉（由 tokens.css 承载）：signal 边框 + `0 0 0 0.2rem signal-soft` 外圈 + `translateY(-0.2rem)`，220ms。
- 面板根元素始终携带 `data-stage={stage}`，CSS 用它驱动 chip 填充。

## 2. 语言切换

- 顶部导航一个文字按钮，显示**另一种**语言的标签（英文态显示"中文"，中文态显示 "EN"），点击在 en ↔ zh 间切换。
- 切换是**全量替换**：所有文案来自一个 `copy` 字典（en/zh 两份、shape 完全一致），包括导航、hero、演示面板、步骤、宣言、CTA、footer。
- `<main>` 的 `lang` 属性同步切换（`en` / `zh-CN`）——影响字体渲染与无障碍发音。
- 默认语言 en；状态不持久化、不读 localStorage（参考实现如此，可按需增强）。

## 3. 导航与锚点

- `#how` / `#why` 两个页内锚点，依赖 `html { scroll-behavior: smooth }` 实现平滑滚动。
- 品牌 wordmark 链接回 `/`。
- 导航 CTA、hero 主按钮、CTA 横幅按钮、footer 链接指向同一目标（参考站为 `/workspace`），且在 stage 3 时统一带上 `?demo=1`——"看完演示再点"与"直接点"行为可区分。

## 4. hover / 过渡清单（时间与位移必须精确）

| 元素 | 效果 | 时长 |
| --- | --- | --- |
| 导航普通链接 / locale 按钮 / footer 链接 | muted → ink 变色 | 180ms |
| 导航 CTA | 边框变 signal + 底色变 signal-soft | 180ms |
| 主按钮 | 底色 `#f08a64 → #ff9b72` + `translateY(-2px)` | 180ms |
| 次按钮 | muted → ink + `translateY(-2px)` | 180ms |
| 重播胶囊按钮 | 边框与文字变 signal | 180ms |
| 演示卡片激活 | signal 边框 + soft 外圈 + 上浮 0.2rem | 220ms |
| `+` 连接符激活 | `scale(1.12)` | 220ms |

除了上浮/缩放，没有任何其他动效：无入场动画、无自动播放、无发光。`prefers-reduced-motion: reduce` 下全部过渡压到 0.01ms。

## 5. 焦点与无障碍契约

- `:focus-visible` = `2px solid signal` 外描边、`offset 4px`（a/button 一律适用）。
- 装饰字形全部 `aria-hidden`：按钮尾箭头 ↗ ↓、重播 ↻、卡片角 ↗、连接符 +、印章整体、骨架条。
- 每个区块 `aria-labelledby` 指向自己的 h2；导航 `aria-label="Primary navigation"`；演示面板有独立 `aria-label`（如 "Product workflow preview"）。
- 语言切换按钮 `aria-label` 说明目标语言（"Switch language to 中文"）。

## 6. 响应式行为（与布局联动）

- **>900px**：双栏 hero（左文案右面板）。
- **≤900px**：hero 折单栏，面板落到文案下方，最大宽 46rem。
- **≤700px**：
  - 导航隐藏普通链接，只留语言按钮 + CTA；
  - 演示面板内部折单列（连接符变横向占位，min-height 1.4rem）；
  - 状态行文字隐藏（保留按钮与信号点）；
  - 三步折一列、印章居中、CTA 横幅改纵向、footer 改纵向。

## 7. 复刻自查（行为维度）

逐条核对，缺一即不算复刻完成：

1. 点击 4 次演示按钮恰好走完 0→1→2→3→0 一整圈；
2. 每次点击只有对应阶段的一张卡片（+连接符）亮起；
3. stage 3 时版本 chip 实底、且所有 CTA href 带 `?demo=1`；
4. 状态行随点击变化且对屏幕阅读器可达；
5. 中英一键切换后整页文案 + `lang` 属性全部改变；
6. 锚点平滑滚动、焦点环为橙色 2px、hover 只有变色与 2px 上浮两种；
7. 900/700 两档断点表现与第 6 节一致。
