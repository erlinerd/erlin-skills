---
name: erlin-social-assets
maturity: productivity
description: >-
  Social media promo assets from app screenshots and brand material: Instagram, X, Xiaohongshu, YouTube, Facebook sizes, with optional Remotion video, plus a built-in LAN preview server for reviewing assets on a phone. App Store marketing compositions belong to erlin-app-store-marketing. 根据 app 截图与品牌资产生成社交平台宣传物料——Instagram、X、小红书、YouTube、Facebook 等规格的宣传图与可选 Remotion 视频；内置局域网预览服务（局域网看图/手机看图/LAN 预览/物料预览）。不负责 App Store 营销构图图；该任务使用 erlin-app-store-marketing。
when_to_use: 生成社媒宣传物料（宣传图/promo/营销素材/推广图），或要把图片/物料目录变成局域网可看的预览画廊（局域网看图/手机看图/LAN 预览/物料预览/二维码看图）时使用；用户说“社媒宣传/宣传物料/宣传图/宣传视频/promo/social media/营销素材/推广图”即触发，无需点名本技能。宣传视频默认不生成：只有用户指明要视频或直接要求时才生成，生成前确认竖/横与时长。
keywords:
  - 社媒宣传
  - 社交平台宣传图
  - 宣传物料
  - 宣传视频
  - promo
  - social media
  - 局域网看图
  - 手机看图
  - LAN 预览
  - 物料预览
  - 预览服务
  - 二维码看图
---

# 目标

把 app 截图（提审截图 / 实测截图 / 用户提供）+ 品牌资产（logo、色板、字体规范）变成按社交平台规格（Instagram、X、小红书、YouTube、Facebook 等）的宣传图与可选 Remotion 视频；交付环节可用自带 `scripts/serve_lan.mjs` 起局域网画廊给手机看。宣传图是默认产出；范围红线以「门禁」为准。

# 执行步骤

1. **收集输入与品牌**：
   - **截图**：优先用现成高质量截图（提审截图、store assets、运行实拍）；没有合适的就用目标 app 补拍模拟器截图。
   - **品牌**：读取项目品牌文档（BRAND.md / brand-assets / 主题色常量）；无文档时询问用户品牌色与 logo 位置；仍无则用「暗底 + 暖白 + 琥珀」器物风默认（随时可调）。
   - **logo**：优先官方的透明/纯色版资产（如 `klo-logo-odot-regular.png` 一类）。
2. **定平台与规格（每次调用都先问）**：先问一句要哪些平台，给主流组合作推荐（小红书 3:4 + Instagram 4:5 + X 16:9），用户确认后再开工；不要默认跳过这步。规格表见 `references/platform-specs.md`。
3. **设计静态宣传图（渲染路径按机器条件选）**：
   - 首选：HTML/CSS 设计稿 + Playwright 无头浏览器截图（文本排版精准、易迭代）；已有 Remotion 工程可用 `remotion still` 同栈导出单帧。
   - **零依赖固定脚本**：先设 `SKILL_DIR="<本技能目录>"`（宿主注入的技能实际路径），再跑 `node "$SKILL_DIR/scripts/make_social.mjs" <config.json>`——配置驱动（品牌色板/文案/截图/平台规格全在 JSON）、macOS swift kernel 渲染（系统自带，无需装依赖）、中文字体自动探测（PingFang → Hiragino → STHeiti，回退字形与 PingFang 有细微差异，介意可换字体文件）、排版尺寸按画布比例缩放（同一配置可出任意平台规格）；输出 PNG 直出精确尺寸。截图纵横比过陡会打警告（竖版布局可能溢出，换 wide 布局）。示例配置位于本技能目录 `scripts/config.example.json`。Playwright/Chrome 不可用或要确定性复现时用这条（需 macOS + node）。
   - 构图要素：品牌 logo、一句核心卖点（大标题 ≤8 字 + 一行副文案）、1-2 张 app 截图（设备/圆角卡框）、品牌色背景或暗底、可选的下载提示。
   - **品牌一致**：色板/字体/间距对齐品牌文档；暗底类产品保持暗底（品牌唯一红线）。
4. **逐规格输出**：每平台一张，按 `<platform>-<width>x<height>.png` 组织到 `out/social/`；尺寸用 sips 逐张核对。
5. **自检**：尺寸精确；文字无溢出/截断（OCR 核验文案齐全）；logo 清晰；截图内容无状态栏敏感信息——沿用 `erlin-app-store-marketing`（Part A）的审核思路：信 OCR/像素，视觉只做粗评。
6. **宣传视频（用户明确要求才做）**：
   - 生成前确认（规格不明时）：竖 9:16（Reels / TikTok / 小红书 / Shorts）还是横 16:9（YouTube）；时长（默认 15-30s）；素材编排（截图切换 / logo 动画 / 文案逐句）。
   - 技术栈：Remotion（React）。脚手架、工程组织、导出见本技能目录 `references/remotion-workflow.md`；动画写法遵循项目已安装的 Remotion 规范；未安装时直接按该 reference 的动画约束执行。
   - 产出规格：竖 1080×1920 / 横 1920×1080，fps 30，H.264 MP4。
7. **交付**：静态图目录 + 视频文件（如有）；逐项标注平台与规格；写明设计稿/工程位置（可复现，改文案重跑一遍即可）。交付前**询问用户**："是否开启局域网预览服务看这批图？"——是 → 起服务（见下）并报 URL；否 → 只报本地路径。

   ```sh
   SKILL_DIR="<本技能目录>"  # 宿主注入的技能实际安装路径
   node "$SKILL_DIR/scripts/serve_lan.mjs" <产物目录> [--port 8765]
   node "$SKILL_DIR/scripts/serve_lan.mjs" --list
   node "$SKILL_DIR/scripts/serve_lan.mjs" --stop <port|all>
   ```

   服务行为：画廊首页每次刷新重扫目录（含子目录，新增图片即时可见）；默认 10 分钟无请求自动退出（`--idle <分钟>` 可调）；默认端口 8765 被占自动 +1；进程脱离会话常驻；注册表在 `~/.lan-serve/servers.json`（`--list` 自动清死进程记录）；支持 png/jpg/jpeg/webp/gif。报 URL 用输出的完整地址（`已启动: http://<本机局域网IP>:<端口>`），不猜 IP。macOS 首次可能弹"允许 node 接受传入连接"，必须选允许。只服务目标产物目录，禁止服务 `~` 或项目根。看图环节结束 `--stop <port>` 关掉。

# 判断规则

- **App Store 营销构图图**：不归本技能，一律转交 `erlin-app-store-marketing`。
- **宣传视频（硬性）**：用户没提视频 → 完全不产出视频；交付说明里可带一句"如需宣传视频可再让我做"。用户说"要视频""加视频""做成动画视频"等 → 才生成。
- **渲染路径分支**：Playwright/Chrome 可用 → HTML/CSS + 截图；不可用或要确定性复现 → 零依赖脚本 `make_social.mjs`（需 macOS + node）。
- **品牌信息分支**：有品牌文档 → 直接读；无文档 → 问用户；仍无 → 「暗底 + 暖白 + 琥珀」器物风默认。
- **交付预览分支**：用户要局域网预览 → 起 `scripts/serve_lan.mjs` 报 URL；不要 → 只报本地路径。图片改了不生效按 Cmd/Ctrl+R 强刷即可（画廊每次刷新重扫）；手机超时但本机 `curl 127.0.0.1:<port>` 正常 = 防火墙拦了，去 系统设置 → 网络 → 防火墙 放行 node。

# 输出格式

- 静态图：每平台一张，命名 `<platform>-<width>x<height>.png`，组织到 `out/social/`。
- 视频文件（如有）：竖 1080×1920 / 横 1920×1080，fps 30，H.264 MP4。
- 交付说明：逐项标注平台与规格；写明设计稿/工程位置（可复现，改文案重跑一遍即可）。
- 局域网预览（如开启）：一行 URL + 常驻画廊服务，看完 `--stop` 关闭。

# 示例

## 用户问题

"用这几张提审截图出小红书和 Instagram 的宣传图，我们是暗底产品。"

## 工具返回

### make_social.mjs

读入 config.json（暗底品牌色板、大标题 + 副文案、两张截图、小红书 3:4 与 Instagram 4:5 规格），macOS swift kernel 渲染，直出两张精确尺寸 PNG；截图纵横比正常，无溢出警告。

### sips

逐张核对 `out/social/` 下两份 PNG 尺寸精确；配合 OCR 核验文案齐全无截断、logo 清晰、无状态栏敏感信息。

## 最终输出

`out/social/` 下两张宣传图 + 交付说明（逐项标注平台与规格、设计稿/工程位置，可改文案重跑）；询问用户是否开启局域网预览服务看这批图。

# 门禁

- 不产出 App Store 营销构图图，一律转交 `erlin-app-store-marketing`。
- 用户没提视频就完全不产出视频。
- 每次调用先确认平台与规格，用户确认后再开工。
- 暗底类产品保持暗底（品牌唯一红线）；色板/字体/间距必须对齐品牌文档。
- 交付前自检必须全过：尺寸精确、文字无溢出/截断（OCR 核验）、logo 清晰、截图无状态栏敏感信息。
- 交付前询问用户是否开启局域网预览服务；开了就在看图环节结束后 `--stop <port>`，避免常驻端口堆积。
