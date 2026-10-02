---
name: erlin-app-store-marketing
maturity: engineering
description: >-
  End-to-end App Store screenshot production: Part A submission-accurate captures (simulator shots, status bar override, OCR verification) and Part B high-conversion ASO marketing compositions (feature extraction, device frames, precise crops). Use for "ASO screenshots", "store screenshots", "marketing images" — even if not named. 生成 App Store 截图物料全流程——提审规格截图（模拟器拍摄、状态栏 override、OCR 逐项核验）与高转化 ASO 营销构图图（卖点提炼、配对、AI 增强、精确裁剪）。用户提到"ASO 截图""商店营销图""提审截图""App Store 截图""store screenshots""黄金时刻 10:08"时使用——即使没提 skill 名。
when_to_use: 用户提到"ASO 截图""商店营销图""营销版截图""应用商店截图设计""aso screenshots""提审截图""App Store 截图""截图审核物料""store screenshots""截图素材""黄金时刻 10:08"时使用；相关截图/物料任务即触发，无需点名本技能。
keywords:
  - ASO 截图
  - App Store 营销图
  - 营销构图
  - 应用商店截图
  - App Store 营销截图
  - aso screenshots
  - 提审截图
  - App Store 截图
  - store screenshots
  - 黄金时刻 10:08
---

erlin-app-store-marketing — App Store 截图物料全流程

你是 ASO 顾问 + 截图设计师。本 skill 覆盖 App Store 截图物料全流程。

# 目标

两个产物方向：

- **Part A 提审规格截图**：原生分辨率、无构图，每张都能证明"内容正确"——尺寸精确、无敏感信息，审核手段用 OCR 与像素核验，不靠肉眼（肉眼会漏）。时钟类 App 额外核对状态栏与表盘时间一致。
- **Part B 营销构图图**：卖点标题文案 + 设备框 + 品牌底色的构图图，配 AI 增强。

典型流程：**先 Part A 拍原生图，再 Part B 出构图图**（构图直接取用 Part A 的拍摄产物）。只要提审图 → 只跑 Part A；只要营销图 → 直接进 Part B，但截图采集必须遵守 Part A 的拍摄与状态栏规范。

# 执行步骤

**Part A：提审规格截图（生成 + 审核）**

A1. **确定规格档位**（先问 App Store Connect 要哪些）：

| 设备 | 常见规格（宽×高） |
| --- | --- |
| iPhone 6.5" | 1242×2688（iPhone 11 Pro Max 系）或 1290×2796（iPhone 16 Pro Max 系） |
| iPhone 6.7" | 1290×2796 |
| iPhone 6.9" | 1320×2868 |
| iPhone 5.5" | 1242×2208 |
| iPad 12.9" / 13" | 2048×2732（12.9" 3rd gen 系）或 2064×2752（13" M4/M5 系） |
| 横屏 | 竖屏宽高互换（如 2796×1290） |

以 App Store Connect 版本页提示的必需尺寸集合为准。**同时保留原生分辨率原图**（如 1320×2868 / 2064×2752），规格图从原图缩放而来，命名区分（如 `1_classic_raw.png` + `1_classic_6.5in.png`）。

A2. **准备模拟器与拍摄**：

1. **设备**：用目标设备（如 iPhone 17 Pro Max 模拟 6.5"、iPad Pro 13-inch 模拟 13"）。**多台模拟器同开时必须用 UDID，不要用 `booted` 通配符**（会命中错误设备）。
2. **安装 app**：装目标 bundle id 的构建；截图用 Release 语义（正式 id），与提审物料一致。
3. **状态栏 override**（截图前执行，状态栏显示与真实时间/电量解耦）：

   ```sh
   xcrun simctl status_bar <udid> override --time "10:08" --batteryLevel 100 --wifiBars 3 --cellularBars 4
   ```

   `--time` 只改状态栏外观；app 内时钟由启动参数注入，两者需一致（提审规范建议时间一致）。
4. **启动注入表盘与时间**（示例，参数按各 app 的注入协议）：

   ```sh
   xcrun simctl launch <udid> <bundleId> -skinId classic -time 10:07:55 -showsSeconds 1
   ```

   时钟类 App 才需要注入表盘时间：**注入到 10:07:55，等 5 秒再截图**——表盘秒针走到 10:08:00 整、归位 12 点，数字表盘秒值干净（10:08:00）。其他 App 使用自身测试数据注入，不要求表盘时间。
5. **截图**：`xcrun simctl io <udid> screenshot <out.png>`。截前确认浮层已隐藏（如 Dock 闲置 2s 自动隐藏——启动后等足再截）。
6. **设置页等交互界面**：用 XCUITest 打开（可注入时间保持一致），或测试内截图（横屏类界面用 XCUITest attachment 比 simctl 可靠）。

A3. **缩放（脚本 scripts/resize.mjs）**：

```sh
SKILL_DIR="$HOME/.agents/skills/erlin-app-store-marketing"
node "$SKILL_DIR/scripts/resize.mjs" <raw.png> <宽> <高> [输出.png]
```

- 先中心裁切到目标纵横比，再用 LANCZOS 等比缩放；源与目标纵横比差 >1% 直接失败，避免输出变形。
- 无输出路径时输出为 `<原名>_<宽>x<高>.png`。

A4. **审核清单（逐项核验，输出物交用户前必须全过）**：

1. **尺寸精确**：每张图 `sips -g pixelWidth -g pixelHeight` 批量核对，逐张等于目标规格。
2. **时间一致（仅时钟类 App）**：状态栏时间 = 表盘时间 = 10:08（黄金时刻）。OCR 状态栏文本核对；表盘用注入时刻推算（10:07:55 + 5s）。其他 App 不执行表盘时间检查。
3. **内容完整**：OCR 核验表盘渲染（数字/指针/日期行齐全，无乱码、无截断）；设置页等界面元素齐全、无空 Section。
4. **无敏感信息**：状态栏无真实时间/电量（已 override）；无真实通知、无账号信息；无调试残留（探针 UI、console 水印）。
5. **浮层已隐藏**：Dock/菜单/弹层不在画面里（自动隐藏的等足超时）。
6. **视觉一致**：品牌色板统一（暗底/暖白/琥珀），无遮挡、无半截元素；同内容 iPhone/iPad 两档观感一致。
7. **可核对锚点**：若 app 设置页有构建信息区（构建时间=二进制 mtime 等唯一值），保留在截图中供提审对账。
8. **文件组织**：每张规格图 + 对应 `_raw` 原图；目录 README 记录日期/构建/设备/注入命令（可复现）。

A5. **审核工具（references/verification.md）**：

- **OCR 核验**：`scripts/ocr_screens.swift`（Vision 框架，识别文字 + 包围盒坐标），核验表盘/界面内容。
- **像素核验**：`scripts/avg_color.swift`（平均 RGB + 采样区颜色），核验皮肤色调与品牌一致性。

**Part B：营销构图图（ASO）**

流程分阶段执行，顺序：RECALL → Benefit Discovery → Screenshot Pairing → Generation。每阶段结束存档到持久记忆，支持断点续跑。

B0. **RECALL（每次先做）**：动手前先查持久记忆（memory 目录）里该 app 的既有进度，按序检查：

1. **Benefits** — 已确认的标题卖点 + 目标受众 + app 背景
2. **Screenshot analysis** — 模拟器截图路径、评级（Great/Usable/Retake）、描述
3. **Pairings** — 卖点 ↔ 截图配对
4. **Brand colour** — 已确认底色（名 + hex）
5. **Generated screenshots** — 已生成/已裁剪文件路径及对应卖点

向用户汇报进度摘要（哪些 ✅ 哪些 ⏳），然后让用户选：续跑（默认）/ 重做某阶段 / 微调单项。记忆全空 → 直接进 Benefit Discovery。

B1. **BENEFIT DISCOVERY（最关键阶段，只在无已确认卖点、或用户明确要求重做时执行）**：

- **Step 1: 分析代码库**：通读项目：UI 文件/页面（用户能做什么）、Models（什么领域）、IAP/订阅（付费点是什么）、Onboarding（首推什么）、app 名/bundle id/营销文案、README 与商店元数据。建立心智模型：核心功能 / 目标人群 / 差异化 / 解决什么问题。
- **Step 2: 向用户提问补盲区**：先讲从代码里读到了什么，再问代码答不了的问题：目标受众？细分领域？下载的第一理由？主要竞品及用户抱怨？好评里用户最爱什么？代码已回答的不要问。
- **Step 3: 起草核心卖点**：3-5 条，每条必须：**动词开头**（TRACK / SEARCH / BOOST / BUILD…）；讲用户得到什么，不是 app 有什么功能；具体到有说服力（"TRACK TRADING CARD PRICES" 而非 "MANAGE YOUR COLLECTION"）；回答"为什么下载你而不是划走"。
- **Step 4: 与用户打磨**：用户明确确认前不进下一阶段。允许改写/排序/增删；用户选了泛泛的词要礼貌推回具体的版本。
- **Step 5: 存档**：确认后写入持久记忆（如 `aso_benefits.md`）：app 名 + bundle id、最终卖点列表（完整标题）、受众、关键背景、打磨过程中的偏好（如"用户偏好 TRACK 胜过 MONITOR"）。

B2. **SCREENSHOT PAIRING**：

- **Step 1: 收集模拟器截图**：接受目录、文件列表、glob（`~/Desktop/Sim*.png`）。逐张查看。拍摄新图按 Part A A2 执行。
- **Step 2: 逐张评级**：每张给 **Great / Usable / Retake** 评级 + 直接的反馈：展示什么 / 强在哪 / 问题在哪。必查项：空状态或占位数据（转化杀手）、内容过稀（列表只有 1-2 项）、debug UI/控制台日志、状态栏干扰（低电量/运营商名/奇怪时间）、缩略图下看不懂（小字太多无层次）、设置页/登录页（几乎都不能用）、深浅模式不一致。
- **Step 3: Retake 指导**：评级 Retake 的、或某卖点没有合适截图的，给出具体重拍指导：去哪个页面、数据摆什么状态（"列表至少 5-6 项""图表呈上升趋势"）、统一深浅模式、内容真实化（别用 Test Item 1）、沿用已批准原生截图的状态栏时间和 override 命令（见 Part A A2）。要敢下判断。
- **Step 4: 配对**：每个卖点配最佳截图（只用 Great/Usable）：相关性（讲价格卖点的图必须真的有价格）、视觉冲击（内容丰富 > 空泛）、缩略图可读性、尽量不复用同一张。给出配对 + 理由，可附一条 💡 优化建议。某卖点全是 Retake → 明说 + 重复重拍指导。
- **Step 5: 确认**：用户确认配对后才进 Generation。需要重拍就暂停等新图。
- **Step 6: 存档**：全部截图分析 + 配对 + Retake 原因写入持久记忆（如 `aso_screenshot_pairings.md`），保证下次会话不用重交截图重做分析。

B3. **GENERATION**：两段式：**Stage 1** `compose.mjs` 本地确定性出图（文字/设备框/截图/底色，保证全套布局一致）；**Stage 2** opencodex 本地代理 AI 增强（把扁平脚手架变成有光影、breakout 元素的成品图；gen_image 走 OPENCODEX_URL/127.0.0.1:10100 的 OpenAI 兼容 HTTP，计费走 Codex 订阅，无需任何 API key）。

- **前置检查**：

```bash
command -v opencodex >/dev/null 2>&1 && echo "opencodex 已安装" || echo "opencodex 未安装"
curl -s -m 3 http://127.0.0.1:10100/v1/models | head -c 100
```

  两项检查独立判断：**端点无响应 ≠ 二进制不存在**——opencodex 未安装/未启动只影响「由它代管服务」的场景；只要 127.0.0.1:10100 有 OpenAI 兼容生图服务在跑（opencodex 之外也可以），Stage 2 就能继续。端点无响应且本机也没有其他兼容通道 → 与用户确认替代生图通道或请其启动代理后再继续，不静默跳过 Stage 2。

- **App Store Connect 规格**：档位全表见 Part A A1。营销图竖屏默认 1290 × 2796，有歧义先问。每个档位最多传 10 张。
- **⚠️ 宽高比**：Apple 要求的比例（~0.461）比 9:16 更窄。生图脚本的输出尺寸由后端决定；可通过 `--size` 显式传递尺寸，但无论是否传入都必须按实际像素检查。若输出是方图，流程是：AI 出图 → 裁掉左右到目标比例 → 上采样到目标尺寸。**所有文字必须保持在画面中央 ~70% 安全区内**，靠近左右边缘的文字裁剪必被切掉。标题过长就多折行，不要横向拉伸。
- **截图格式规范**（全套一致是硬要求——用户在商店里横滑对比，字体/字号/布局不一致显业余）：
  - **Line 1 动词**：全图最大最粗的白字，大写居中。**Line 2 描述语**：明显小一号但仍粗白大写居中。字体统一用重黑体（SF Pro Display Black / Inter Black），每张同字体同字号同字重
  - **位置**：文字占顶部 ~20-25%，与顶边留舒适边距；水平居中于中央 70% 安全区
  - **设备框**：现代 iPhone 样机（黑框 + 灵动岛），内嵌模拟器截图；设备放画布**偏上**（紧贴标题下方而非沉底），底部**溢出画布边缘**（刻意裁切，现代感），水平居中
  - **背景**：纯色品牌底铺满，全套同色。禁止渐变/光晕/放射纹
  - **Breakout 元素（可选，克制）**：仅当屏幕上有明显相关 UI 面板时，把**整个面板/卡片**（不是单个按钮图标）原位放大（不旋转）冲出设备框两侧、几乎撑满画布宽，底下加柔和投影制造悬浮感。无合适面板就不加——干净优于硬凑。最多再配 1-2 个小辅助元素，且不得与主 breakout 抢戏
- **生成流程**（第一张批准图作为全套风格模板：后续每张同时参考自己的 scaffold 定布局 + 第一张成品定风格）：
  - **Step 0: 品牌色先存档**（写入 benefits 记忆文件，名 + hex）。品牌色自动确定，不问用户：分析代码库 accent/tint/资源目录色 → 看截图主色调 → 按领域定性格（游戏可大胆，金融要稳重）。标准：衬托截图 UI、缩略图下抓眼（忌白/浅灰）、避开与 app UI 主色撞色。给出色值 + 一句理由，用户可否决但不作为提问。
  - **Step 1: compose.mjs 出脚手架**（脚本在本 skill `scripts/` 下，路径以会话中给出的 skill base directory 为准）：

```bash
SKILL_DIR="<本 skill 目录>"
mkdir -p screenshots/01-[slug] screenshots/02-[slug] screenshots/03-[slug] && \
node "$SKILL_DIR/scripts/compose.mjs" --bg "[HEX]" --verb "[VERB1]" --desc "[DESC1]" \
  --screenshot [shot1.png] --output screenshots/01-[slug]/scaffold.png && \
node "$SKILL_DIR/scripts/compose.mjs" --bg "[HEX]" --verb "[VERB2]" --desc "[DESC2]" \
  --screenshot [shot2.png] --output screenshots/02-[slug]/scaffold.png && \
node "$SKILL_DIR/scripts/compose.mjs" --bg "[HEX]" --verb "[VERB3]" --desc "[DESC3]" \
  --screenshot [shot3.png] --output screenshots/03-[slug]/scaffold.png
```

    输出像素精确的成品底图。脚手架是内部中间产物，不展示不确认，直接进 Step 2。

- **Step 2: gen_image.mjs AI 增强 ×3 并行**（脚本同在 `scripts/`；未传 `--model` 或 `--effort` 时使用脚本默认值）。保存每个后台任务的 PID 并聚合退出码；任一版本失败就停止，不进入裁剪：

```bash
set -uo pipefail
SKILL_DIR="<本 skill 目录>"
pids=()
versions=(v1 v2 v3)
for V in "${versions[@]}"; do
  node "$SKILL_DIR/scripts/gen_image.mjs" \
    --prompt "[下面模板填好的完整提示词]" \
    --input-image screenshots/01-[slug]/scaffold.png \
    --output "screenshots/01-[slug]/$V.png" &
  pids+=("$!")
done

status=0
for i in "${!pids[@]}"; do
  if ! wait "${pids[$i]}"; then
    printf 'ERROR: ASO generation failed for %s\n' "${versions[$i]}" >&2
    status=1
  fi
done
if [ "$status" -ne 0 ]; then
  exit "$status"
fi
```

    首图只传 scaffold；后续图加传风格模板（`--input-image` 可重复，最多 3 张）。
    **首图提示词模板**：逐字全文见本 skill `references/prompt-templates.md`——保持英文原文（生图模型对英文提示词遵循度更高），占位符按当张截图实际填写。首图只传 scaffold，不传风格模板。
    **后续图提示词模板**：逐字全文见 `references/prompt-templates.md`；`--input-image` 依次传：本图 scaffold + 风格模板（第一张批准图）。
    **一致性执法**：scaffold 管布局、风格模板管视觉。AI 改了文字、动了布局、偏离风格模板 → 重生成。

- **Step 3: 立刻裁剪到 App Store 规格**（按实际 AI 输出尺寸裁边 + 上采样；单条 Bash 处理全部版本）：

```bash
set -euo pipefail
TARGET_W=1290
TARGET_H=2796
for INPUT in screenshots/01-[slug]/v1.png screenshots/01-[slug]/v2.png screenshots/01-[slug]/v3.png; do
  OUTPUT="${INPUT%.png}-resized.jpg"
  cp "$INPUT" "$OUTPUT"
  W=$(sips -g pixelWidth "$OUTPUT" | tail -1 | awk '{print $2}')
  H=$(sips -g pixelHeight "$OUTPUT" | tail -1 | awk '{print $2}')
  CROP_W=$(node -p "Math.round($H * $TARGET_W / $TARGET_H)")
  OFFSET_X=$(node -p "Math.round(($W - $CROP_W) / 2)")
  sips --cropOffset 0 "$OFFSET_X" --cropToHeightWidth "$H" "$CROP_W" "$OUTPUT"
  sips -z "$TARGET_H" "$TARGET_W" "$OUTPUT"
  ACTUAL_W=$(sips -g pixelWidth "$OUTPUT" | tail -1 | awk '{print $2}')
  ACTUAL_H=$(sips -g pixelHeight "$OUTPUT" | tail -1 | awk '{print $2}')
  if [ "$ACTUAL_W" -ne "$TARGET_W" ] || [ "$ACTUAL_H" -ne "$TARGET_H" ]; then
    printf 'ERROR: wrong output size for %s: %sx%s\n' "$OUTPUT" "$ACTUAL_W" "$ACTUAL_H" >&2
    exit 1
  fi
  echo "--- $OUTPUT (${ACTUAL_W}x${ACTUAL_H}) ---"
done
```

    裁剪保顶对齐（左右等量裁掉，标题位置不动），再缩放到精确尺寸。其他档位改 `TARGET_W/TARGET_H`（6.5": 1242/2688；6.9": 1320/2868）。**任何图没跑完本步不许给用户看**——原始 AI 输出永远不是合规尺寸。原生提审规格图的缩放改用 `scripts/resize.mjs`（Part A A3，带纵横比守卫）。

- **Step 4: 用户三选一**：用 Read 展示三张 `-resized` 版本，标 Version 1/2/3，让用户挑或提修改。
- **Step 5: 迭代**：用户要改 → `gen_image.mjs` 传三张输入图（scaffold 定布局 + 风格模板定视觉 + 用户选中的版本定创意方向），迭代提示词模板逐字全文见 `references/prompt-templates.md`。同样 3 版本并行 + 立即裁剪，循环到满意。
- **Step 6: 收编进 final/**：

```bash
mkdir -p screenshots/final && cp "screenshots/01-[slug]/v2-resized.jpg" "screenshots/final/01-[slug].jpg"
```

- **Step 7: 存档**：每张批准后**立刻**增量写入持久记忆（`aso_generated_screenshots.md`）：品牌色、目标档位、每张的卖点/子目录/用户选中版本/最终路径/所用模拟器截图/breakout 描述/状态（generated / approved / needs-redo）/用户反馈。中断可续。

- **Showcase 图**：全套批准后，用 `scripts/showcase.mjs` 出一张三联预览图（GitHub 链接用 `github.com/erlinerd` 或用户指定）：

```bash
node "$SKILL_DIR/scripts/showcase.mjs" \
  --screenshots screenshots/final/01-*.jpg screenshots/final/02-*.jpg screenshots/final/03-*.jpg \
  --github "github.com/erlinerd" \
  --output screenshots/showcase.png
```

- **交付：询问是否开启预览服务**：交付物料前**询问用户**："是否开启局域网预览服务看这批图？" 是 → 调用 `erlin-web-lan-preview` 的 `scripts/serve_lan.mjs <产物根目录> [--port]`，报 URL 给用户（手机同 Wi-Fi 可看）；否 → 只报本地路径。

# 判断规则

- **边界（相邻技能分工）**：商店元数据多语言走 `erlin-app-store-compliance`（内含多语言文案流程）；社媒物料走 `erlin-social-assets`；本 skill 管截图本身。
- **入口分叉**：只要提审图 → 只跑 Part A；只要营销图 → 直接进 Part B，但截图采集必须遵守 Part A 的拍摄与状态栏规范。
- Benefit Discovery 只在无已确认卖点、或用户明确要求重做时执行；记忆全空 → 直接进 Benefit Discovery。
- 用户选了泛泛的词要礼貌推回具体的版本；品牌色自动确定不问用户，用户可否决但不作为提问。
- **A6 坑（来自真实项目）**：
  - **多台模拟器同开**：一律用 UDID，`booted` 会命中错误设备（截图内容错且难发现）。
  - **横屏截图**：`-landscape` 启动注入会持久化横屏锁（AppStorage 写入，卸载重装才清）；真横屏验证用 XCUITest 的 XCUIDevice 旋转 + 测试内 attachment。
  - **status_bar override 会跨启动残留**：拍摄完一轮后 `xcrun simctl status_bar <udid> clear` 恢复，避免影响后续调试。
  - **时间注入步进**：不要注入精确目标时刻——表盘秒针/翻页会卡在过渡帧；注入目标前 5 秒等它自然走到。
  - **缩放拉伸**：先算源/目标纵横比再缩，差 >1% 要重新选规格档位而不是硬拉。
- **KEY PRINCIPLES**：
  - **卖点 > 功能**："BOOST ENGAGEMENT" 而非 "ADD SUBTITLES TO VIDEOS"
  - **具体 > 泛泛**："TRACK TRADING CARD PRICES" 而非 "MANAGE YOUR STUFF"
  - 每条标题动词开头；一切从下载者视角出发；每个决策自问"这能让人点下载吗"
  - 第一张最重要——传达第一下载理由；全套横滑在讲故事
  - 视觉冲击最强的模拟器截图配最重要的卖点
  - **信 OCR/像素，不靠肉眼**：判断以 OCR/像素结果为准，视觉模型只做粗评

App Store 三技能互引：ASC 记录/Bundle 操作 → `erlin-asc`；截图物料/营销构图 → `erlin-app-store-marketing`；被拒整改/提审自查 → `erlin-app-store-compliance`。


# 输出格式

- **Part A**：每张规格图 + 对应 `_raw` 原图；目录 README 记录日期/构建/设备/注入命令（可复现）。
- **Part B 输出结构**：

```text
screenshots/
  01-[slug]/{scaffold.png, v1..v3.png, v1..v3-resized.jpg}
  02-[slug]/…
  final/            ← 用户唯一需要关心的目录：每卖点一张批准成品
  showcase.png
  raw/              ← Part A 提审原生图 + 各规格档位（命名见 A1）
```

- 告知用户每张对应 App Store Connect 哪个档位槽位。
- 展示三选一时用 Read 展示 `-resized` 版本，标 Version 1/2/3。

# 示例

## 用户问题

"帮我出一套 App Store 截图：提审要 6.9 英寸规格图，另外挑三个卖点做营销构图图。"

## 工具返回

### xcrun simctl（Part A 拍摄）

`status_bar <udid> override --time "10:08" --batteryLevel 100 ...` 成功；`launch <udid> <bundleId> -skinId classic -time 10:07:55` 后等 5 秒截图 → `1_classic_raw.png`（1320×2868）。

### scripts/ocr_screens.swift（OCR 核验）

识别出状态栏 "10:08"；表盘数字/指针/日期行齐全，无乱码、无截断；无调试残留文本。

### scripts/resize.mjs

`node "$SKILL_DIR/scripts/resize.mjs" 1_classic_raw.png 1320 2868 1_classic_6.9in.png` → 纵横比差 <1%，输出成功。

### compose.mjs（Part B Stage 1）

`--bg "#1A1A1A" --verb "TRACK" --desc "EVERY JOURNEY" --screenshot shot1.png --output screenshots/01-track/scaffold.png` → 像素精确脚手架。

### gen_image.mjs（Part B Stage 2）

v1/v2/v3 三后台任务 PID 全部退出码 0 → `screenshots/01-track/v1..v3.png`。

### sips（裁剪核验）

`v1-resized.jpg` 实测 1290×2796，与目标规格一致。

## 最终输出

- `screenshots/raw/` 提审原生图 + 各规格档位规格图（每张过 A4 审核清单）。
- `screenshots/final/` 每卖点一张批准成品 + `showcase.png` 三联预览图。
- 告知用户每张对应 ASC 哪个档位槽位；询问是否开 `erlin-web-lan-preview` 局域网预览。

# 门禁

- A4 审核清单逐项核验，输出物交用户前必须全过；信 OCR/像素，不靠肉眼，不达标不交付。
- **任何图没跑完裁剪步骤不许给用户看**——原始 AI 输出永远不是合规尺寸；所有输出按实际像素核对，不达标即报错退出。
- 每档位最多 10 张；AI 改了文字、动了布局、偏离风格模板 → 重生成。
- 用户明确确认卖点前不进下一阶段；用户确认配对后才进 Generation；任一版本生成失败就停止，不进入裁剪。
- 代理前置检查端点无响应不继续生成（请用户启动 opencodex 或确认其他 10100 端口的生图通道）。
- 空状态/加载页/设置页永远不进截图。
- 拍摄完一轮后 `xcrun simctl status_bar <udid> clear` 恢复状态栏，避免影响后续调试。
- 全套格式一致是硬要求（字体/字号/布局统一，纯色品牌底，禁止渐变/光晕/放射纹）。
