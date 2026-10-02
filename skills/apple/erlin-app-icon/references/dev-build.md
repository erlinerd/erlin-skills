# erlin-app-dev-build 工作流（已并入 erlin-app-icon）

> 本文是 erlin-app-icon 的 dev 构建身份参考：iOS/macOS Debug 角标图标 + 显示名 Dev 后缀 + 可选改 Bundle ID 变体。脚本 `scripts/make_dev_icon.mjs`（内核 `scripts/dev_icon.swift`）在本技能目录。


# 目标（dev 构建身份）

给 Debug 构建一套肉眼可辨的 dev 身份：**角标图标 + 显示名加 Dev 后缀**。bundle id 默认不变——除非用户明确要求变更。保持分发配置的有效行为不变；先检查实际 Archive 配置，不能假设所有项目都名为 Release。同 ID 在 iOS 上后装覆盖先装；并存必须采用不同 Bundle ID。

# 执行步骤

默认工作流（角标 + Dev 名，iOS）：

1. **勘查**：`ASSETCATALOG_COMPILER_APPICON_NAME` 当前值（默认 `AppIcon`）与 appiconset 结构（单张 1024 universal，还是多尺寸多 idiom——按现有结构照抄）；`GENERATE_INFOPLIST_FILE` 是 YES（显示名走 `INFOPLIST_KEY_CFBundleDisplayName`）还是 NO（手写 Info.plist，用构建变量注入）。
2. **改 Debug 配置**（只动 Debug 块）：
   - `ASSETCATALOG_COMPILER_APPICON_NAME` = `AppIcon-Dev`（Release 保持 `AppIcon`）
   - 显示名加 Dev 后缀：
     - `GENERATE_INFOPLIST_FILE = YES`：Debug 设 `INFOPLIST_KEY_CFBundleDisplayName` = `XX Dev`
     - 手写 Info.plist：把 `CFBundleDisplayName` 的值改为 `$(DEV_DISPLAY_NAME)`，Debug 设 `XX Dev`、Release 设原名（变量注入细节见 references/dev-build-advanced.md）
3. **生成角标图标**：在 Assets.xcassets 下新建 `AppIcon-Dev.appiconset`，Contents.json 结构照抄现有 AppIcon.appiconset，用附带脚本生成 1024 图：
   先设 `SKILL_DIR="<本技能目录>"`（宿主注入的技能实际路径，即 erlin-app-icon 技能目录），再跑 `node "$SKILL_DIR/scripts/make_dev_icon.mjs" <正式图标.png> <AppIcon-Dev.appiconset/icon-1024.png>`
   脚本默认**左上角白色标签 + 黑色 "dev" 文字**（规格：左上角、约图标 1/9 面积、dev 字体大、**仅右下角圆角**）；`dot` 样式可换橙色圆点（呼应 TestFlight 橙），用法见脚本头部注释。生成的 png 和复现所需脚本纳入本次差异，仅已有授权时提交，正式图标改版后重跑一次。拷脚本进项目时 `make_dev_icon.mjs` 与 `dev_icon.swift` 必须成对拷（mjs 按同目录 sibling 解析 swift 内核）。
4. **验证**：Debug、Release 双配置构建通过；Debug 产物 `CFBundleDisplayName` 为 `XX Dev`、图标集为 `AppIcon-Dev`；Release 产物的显示名、bundle id、图标与改动前完全一致。

macOS 补充（仅角标，名称 id 均不动）：macOS 可按不同路径放置副本，但同 ID 仍可能共享偏好、容器或服务注册，不能承诺隔离；需要独立身份时使用不同 Bundle ID 并核查配套能力。macOS 没有系统图标蒙版（iOS 才有统一裁圆角），直角色标会盖住图标的透明圆角——左上角变直角、轮廓破缺。`make_dev_icon.mjs` 输出 1024 图后，把角标 alpha 与源图 alpha 相乘：

```swift
// badge_1024 = make_dev_icon.mjs 输出的角标图；source_1024 = 原正式图标
import AppKit
let badge_1024 = CommandLine.arguments[1]
let source_1024 = CommandLine.arguments[2]
let badgeRep = NSBitmapImageRep(data: try Data(contentsOf: URL(fileURLWithPath: badge_1024)))!
let iconRep = NSBitmapImageRep(data: try Data(contentsOf: URL(fileURLWithPath: source_1024)))!
for y in 0..<badgeRep.pixelsHigh {
    for x in 0..<badgeRep.pixelsWide {
        guard let b = badgeRep.colorAt(x: x, y: y), let s = iconRep.colorAt(x: x, y: y) else { continue }
        badgeRep.setColor(b.withAlphaComponent(b.alphaComponent * s.alphaComponent), atX: x, y: y)
    }
}
try badgeRep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: badge_1024))
```

再缩放出各尺寸（macOS 图标集 10 尺寸）。参考实现：其他项目中的 generate-dev-appicon.sh（外部示例，不属于本技能资源，需按目标项目路径调整）。**改图标后系统会缓存旧图**：`killall iconservicesagent` + `lsregister -f <app>` + `killall Dock` 刷新。验证用 `plutil -p <app>/Contents/Info.plist | grep CFBundleIconName`（应为 `AppIcon-Dev`）与 `assetutil --info <app>/Contents/Resources/Assets.car`。

# 判断规则

- **为什么 id 默认不变**：改 bundle id 看似只是构建配置，实际会级联出整套按 id 绑定的服务栈重配：
  - 如需真实 App Store 沙盒 IAP，检查新 ID 的 ASC app 记录与产品配置；仅本地 StoreKit Configuration 测试不要求据此新建云端记录；
  - 使用 RevenueCat 等服务时核查 app、API key、产品与 entitlement 映射，按实际测试模式配置；
  - 推送、Universal Links、iCloud 等按 id 绑定的能力都要跟着重注册。

  配套成本取决于项目实际能力，所以 id 变更是**用户明确要求才做**的可选变体（见下条）。
- **何时进入改 id 变体（双版本共存）**：用户明确提出"改 bundle id / 双版本共存 / 同一台设备装两个版本"才启用，先说明实际影响；用户已明确授权并存或改 ID 时直接实施，不重复确认同一决定。在默认方案基础上，Debug 配置再加一行：`PRODUCT_BUNDLE_IDENTIFIER` = `<主id>.dev`（若冲突换 `.beta`）。按本次需要验证的能力检查配套（远端写入仍按授权执行）：
  - **App Store Connect 新建 app 记录**（永不提审的草稿），IAP 产品逐字照抄主 id 的产品 ID 重建，填齐定价+本地化到「准备提交」态沙盒才可见；
  - **付费/收据服务（如 RevenueCat）**在同一项目下建第二个 app → 换 Debug 的 API key（建议本就经 `$(KEY)` 构建变量注入）→ 新产品挂同一 entitlement → 服务器通知凭据；
  - 检查 App Groups / 共享 Keychain（共享容器不随 id 隔离）、推送、Universal Links 等按 id 绑定的能力，逐项重配。

  此变体可隔离各自应用沙盒，但 App Groups、Keychain Access Groups、CloudKit container 和后端账号可能仍共享。CloudKit Development/Production 由签名 entitlement、分发方式与容器配置决定，不由 Bundle ID 后缀自动决定；不同 ID 可指向同一容器，必须核查实际环境并验证。
- **同 id 的代价（要向用户说明）**：dev 与正式包共用一个 app 位置，**后装覆盖先装**：Xcode Run 装的 Debug 会替换设备上的 TestFlight/App Store 版。同 Bundle ID 通常共享应用容器；数据是否保留取决于安装方式，必须在目标设备验证，不要把覆盖描述为必然清空。开发机与日常用机分开、或接受覆盖，即可用默认方案。显示名随安装的构建切换（Debug 装→"XX Dev"，TestFlight 装→原名）——这是特性：桌面一眼可辨当前装的是哪个构建。
- **macOS 判断**：不同路径可放副本但同 ID 不保证独立身份；按并存与隔离需求决定名称/id（见「执行步骤」macOS 补充）。

# 输出格式

- Debug 配置新增：`ASSETCATALOG_COMPILER_APPICON_NAME` = `AppIcon-Dev`（Release 保持 `AppIcon`）+ 显示名 Dev 后缀（`INFOPLIST_KEY_CFBundleDisplayName` 或 `$(DEV_DISPLAY_NAME)` 构建变量注入）；改 id 变体再加 `PRODUCT_BUNDLE_IDENTIFIER` = `<主id>.dev`。
- 新增 `AppIcon-Dev.appiconset`（Contents.json 照抄现有结构）+ 脚本生成的 1024 png；保留复现脚本，提交仅按已有授权执行。
- 交付时说明安装覆盖、隔离与验证限制；项目要求时再更新现有文档。

# 示例

## 用户问题

"打个 dev 包：Debug 图标加个 dev 角标、名字带 Dev，别动正式包，也别改 bundle id。"

## 工具返回

### 勘查（实际输入材料，项目工程）

- `ASSETCATALOG_COMPILER_APPICON_NAME` = `AppIcon`，AppIcon.appiconset 为单张 1024 universal
- `GENERATE_INFOPLIST_FILE` = YES（显示名走 `INFOPLIST_KEY_CFBundleDisplayName`）

### make_dev_icon.mjs（附带脚本）

先设 `SKILL_DIR="<本技能目录>"`（宿主注入的技能实际路径，即 erlin-app-icon 技能目录），再跑 `node "$SKILL_DIR/scripts/make_dev_icon.mjs" <正式图标.png> <AppIcon-Dev.appiconset/icon-1024.png>` → 输出 1024 图：左上角白色标签 + 黑色 "dev" 文字（约图标 1/9 面积、dev 字体大、仅右下角圆角）。

## 最终输出

- Debug 产物：显示名 `XX Dev`、图标集 `AppIcon-Dev`；Release 产物：显示名、bundle id、图标与改动前完全一致。
- Debug、Release 双配置构建通过；交付 AppIcon-Dev.appiconset 与复现方式，说明同 ID 安装覆盖行为。

# 门禁

- **Release 配置永远不动**；bundle id 默认不变，改 id 仅限用户明确提出，说明配套影响并沿用已有授权。
- **验证红线**：Debug、Release 双配置构建通过；Debug 产物 `CFBundleDisplayName` 为 `XX Dev`、图标集为 `AppIcon-Dev`；Release 产物的显示名、bundle id、图标与改动前完全一致。
- **交付须说明的注意事项**：
  - 同 id 方案下 Xcode Run / Archive 装真机都会替换正式包；同 Bundle ID 的数据行为取决于安装方式，需在目标设备验证。
  - 改 id 方案下 Archive 后直装也会替换正式包（Release 走正式 id），只有日常 Debug Run 落 `.dev`。
  - 显示名差异只影响 Debug 构建：正式包（TestFlight/App Store）名称永远不变，仍需核验实际分发产物。
  - 正式图标不能有透明通道（iOS 规则）；dev 图不进 App Store，不影响提审。
