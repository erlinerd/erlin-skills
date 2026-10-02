---
name: erlin-app-icon
maturity: engineering
description: >-
  Full workflow for app icons and wordmark logos: palette extraction from brand colors, pixel-accurate rendering with verification, AppIcon asset catalog integration, build confirmation — plus dev-build badge icons (Debug "XX Dev" identity). Use when the user mentions "design a logo", "generate an icon", "app icon", "wordmark", "dev 包/开发版图标" — even if not explicit. 根据产品生成 App 图标/wordmark logo 的完整工作流——品牌色板取色、像素级精确渲染与验证、接入 AppIcon 资源集并构建确认；并负责 Debug 开发版角标图标与 Dev 显示名。用户提到"设计 logo""生成 icon/图标""App 图标""上架图标""wordmark""把 XX 作为 icon""dev 包/开发版/调试版图标"时使用，即使没明说。
when_to_use: 从产品品牌生成 App 图标或 wordmark logo——取品牌色板、像素级渲染与验证、接入 AppIcon 资源集时使用；或给 Debug 构建生成 dev 角标图标与 Dev 显示名（同 ID 覆盖，独立并存需不同 Bundle ID）时使用；提及"设计 logo/生成 icon/上架图标/把 XX 作为 icon/dev 包/开发版"即触发。
keywords:
  - 设计 logo
  - 生成 icon
  - app 图标
  - 上架图标
  - wordmark
  - 作为 icon
  - dev 包
  - 开发版
  - 调试版
  - dev 身份
  - bundle id
  - 双版本共存
---

# 目标

根据产品品牌生成 1024×1024 的 App 图标（wordmark 或文字+强调色元素），像素级精确、可复现、可微调。两类任务：**正式图标**（下文执行步骤）与 **dev 构建角标图标 + Dev 显示名**（Debug 专用，完整工作流见 `references/dev-build.md`，脚本 `scripts/make_dev_icon.mjs`）。

# 执行步骤

1. **读品牌**：先读产品的品牌文档（`docs/BRAND.md` 或类似），取色板（背景色/主内容色/强调色）、字体字重、命名、图标规范。强调色只用于点缀。没有品牌文档就问用户要色板。
2. **出方案**：给 2-3 个变体（纯字 / 字+强调色元素 / 元素嵌入字形），让用户选；字重也给出档位（ultraLight/light/regular），用户常会嫌细。
3. **渲染**：设 `SKILL_DIR="<本技能目录>"`（以宿主给出的技能实际路径为准），把品牌参数（wordmark/色板/字号/变体/强调字形）写进**项目内** `icon-config.json`（加 .gitignore；技能目录经 symlink 是 git 工作树，勿改脚本源码），跑 `node "$SKILL_DIR/scripts/render_icon.mjs" <输出目录> --config icon-config.json`（node 入口 + macOS swift kernel 渲染，系统自带 node/swift 即可跑），渲染时遵守「判断规则」中的管线铁律。config 键位见脚本头部注释。uharfbuzz kerning 检测已省略。
4. **验证**：每次渲染后跑 `node "$SKILL_DIR/scripts/verify_icon.mjs" <图片路径>` 做像素级核验；任一尺寸、墨迹或中心检查失败都会以非零退出（容差与判断细则见「门禁」）。**in-glyph 变体必须追加 `--require-accent --accent-target x,y,1`**——x,y 用 render_icon.mjs 渲染时打印的 `accent-target:` 值；不传则 ±1px 对齐判定不执行。trailing-dots 是两点构图、无单一目标字形中心，只加 `--require-accent`，对齐用 ASCII 目检。
5. **接入**：替换 `AppIcon.appiconset/AppIcon.png`（1024×1024），确认 `Contents.json` 里 ios 与 mac 条目都指向它；`xcodebuild` 构建通过。
6. **提交**：验证通过后报告变更和结果；commit / push 按 `erlin-dev-standards` 授权口径执行。

# 判断规则

渲染管线（铁律）——用 **node + swift kernel（CoreText）** 绘制。文字用 `CTLine` 左缘 + 基线定位，坐标系 y 向上（AppKit），扫描 bbox 的 y=0 在顶部。

- **自校准居中（最重要）**：CoreText 理论度量与实际渲染存在偏差（SFNS 实测约 0.07em，水平垂直都有）——所以先用理论值渲染，再扫描实际墨迹像素，中心偏 >1px 就平移重绘，最后从扫描结果反推实际渲染原点/基线供其他元素定位。**后续元素（强调圆、trailing dots）必须用实际渲染基线，不能用理论值**（实测踩过：圆偏 27px）。
- 字体：`FONT_PATH` 配品牌字体（默认 `/System/Library/Fonts/SFNS.ttf`，等宽数字系统字体；跨平台可换 Inter/DejaVu）。
- 强调元素定位：目标字形墨迹中心 = 实际原点 + 前缀 `getlength` + 单字 `getbbox` 中心；**字形查找按 wordmark 实际字符**（wordmark 改大小写后查找字符必须同步改，否则元素画错位）。
- 元素大小：参考黄金比例——元素直径 : 宿主腹腔（counter）宽 ≈ 1/1.618 ≈ 0.618。用户调大小按 0.02em 步进。

常见坑清单：

| 坑 | 后果 | 对策 |
| --- | --- | --- |
| 用 getbbox 理论值定位强调元素（不用扫描反推的实际值） | 元素偏 ~27px（SFNS 渲染与 bbox 系统偏差） | 先渲染→扫描→反推实际原点/基线 |
| 渲染后不扫描校准 | 文字中心偏几 px | 自校准循环（render_icon.mjs 内建） |
| 字形查找字符与 wordmark 不一致 | 元素画在错误位置 | 按实际字符查（注意大小写） |
| 用尺寸判断模拟器横竖屏 | 误判（物理像素不变） | 看内容布局/OCR 坐标 |
| 渲染后不验证 | 错位视觉可见 | 每次跑 verify_icon.mjs |

# 输出格式

- **出方案**：2-3 个变体（纯字 / 字+强调色元素 / 元素嵌入字形）+ 字重档位（ultraLight/light/regular）。
- **渲染输出**：品牌背景色满铺 1024×1024 PNG。
- **接入落点**：`AppIcon.appiconset/AppIcon.png`（1024×1024）；`Contents.json` 里 ios 与 mac 条目都指向它。

# 示例

## 用户问题

"把我们的产品名做成 wordmark 图标当 App 图标，用品牌色，字重别太细。"

## 工具返回

### render_icon.mjs（渲染脚本）

node 入口 + macOS swift kernel（CoreText）：按配置区的字体/文字/强调元素渲染出品牌背景满铺 1024×1024 PNG；内建自校准循环——理论值渲染 → 扫描实际墨迹 → 中心偏 >1px 平移重绘 → 反推实际渲染原点/基线（SFNS 偏差约 0.07em；不用实际基线定位时强调元素实测偏 27px）。

### verify_icon.mjs（验证脚本）

扫描输出图的颜色像素 bbox，报告文字墨迹中心与强调元素中心的检查结果；任一尺寸、墨迹或中心检查失败以非零退出。注意 verify 打印的"偏差"是相对画布中心 512 的——强调圆在 wordmark 中本就偏位，判断对齐要看与目标字形中心的差值。

## 最终输出

- 2-3 个变体方案（含字重档位）供用户选定；
- 选定后交付：`AppIcon.appiconset/AppIcon.png` 替换为通过 verify 的 1024×1024 图（文字墨迹中心 512±2px、自校准后 ±1；强调元素中心与目标字形腹腔中心 ±1px），`Contents.json` ios/mac 条目指向它，`xcodebuild` 构建通过；
- 报告变更和结果（未明确要求不执行 `git commit`）。

# 门禁

- **每次渲染后必跑验证**：`node "$SKILL_DIR/scripts/verify_icon.mjs" <图片路径>`（in-glyph 变体加 `--require-accent --accent-target x,y,1`，x,y 取渲染输出的 `accent-target:` 行；trailing-dots 只加 `--require-accent`）扫描输出图的颜色像素 bbox，修到全部通过：
  - 文字墨迹中心应 = 512 ± 2px（自校准后通常 ±1；AA 光晕级）
  - 强调元素中心应 = 目标字形腹腔中心 ± 1px（腹腔中心 = 左右笔划段的中点，用行扫描确认）
  - 模型看不了图时：把 PNG 转 ASCII 目检布局（黑底字符映射）
  - 判断方向/布局时注意：Vision OCR 的 bbox 原点在**左下**（y 向上），别把顶部当底部；PIL 的 y=0 在顶部
- **接入验收**：`Contents.json` 里 ios 与 mac 条目都指向新图；`xcodebuild` 构建通过。
- **dev 构建任务红线**（详见 `references/dev-build.md`）：Release 配置永远不动；bundle id 默认不变，改 id 仅限用户明确提出；Debug、Release 双配置构建通过且 Release 产物与改动前完全一致。
- **提交纪律**：验证通过后报告变更和结果；commit / push 授权口径以 `erlin-dev-standards` 为唯一权威源。
