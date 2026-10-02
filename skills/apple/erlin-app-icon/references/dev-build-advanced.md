# 备选方案与细节（按需阅读）

## 构建时动态角标（图标迭代频繁时用）

静态方案在正式图标改版后需要手动重跑脚本；动态方案让每次 Debug 构建从正式图现场生成，永远不用记得重跑。代价：一个 build phase + 一个脚本 + 三个必须做对的细节。

1. 在 Xcode 里给 target 加 Run Script phase，**放在 Compile Assets 之前**，并声明输入 = 正式图标、输出 = 生成的 dev 图——增量构建时正式图没变，整个 phase 被跳过。
2. 脚本三要素：
   - **Debug 守卫**：`if [ "$CONFIGURATION" != "Debug" ]; then exit 0; fi`——否则 Archive / Release 也会执行。
   - **内容没变就不写盘**：生成前比较源图与生成物是否同源（简单做法：`cmp -s` 或 shasum），不写盘 → 受版本控制的 png 不会被每次构建改写，git 保持干净。这是最容易漏的细节。
   - 生成的 png 加进 .gitignore（不提交），Contents.json 和脚本保留在差异中，仅授权后提交。
3. 示例：

   ```bash
   # Run Script phase；输入: $SRCROOT/.../AppIcon.appiconset/AppIcon.png
   # 输出: $SRCROOT/.../AppIcon-Dev.appiconset/AppIcon-Dev.png
   # 前提: 把技能 scripts/ 下的 make_dev_icon.mjs 和 dev_icon.swift 一起拷到
   #       $SRCROOT/scripts/（mjs 按同目录 sibling 找 swift 内核，只拷 mjs 会挂）
   if [ "$CONFIGURATION" != "Debug" ]; then exit 0; fi
   SRC="$SRCROOT/.../AppIcon.png"
   DST="$SRCROOT/.../AppIcon-Dev.png"
   if [ -f "$DST" ] && cmp -s "$SRC" "$DST" 2>/dev/null; then exit 0; fi
   node "$SRCROOT/scripts/make_dev_icon.mjs" "$SRC" "$DST"
   ```

   注意：这里 `cmp -s` 比较的是源图与生成物——正式图本身是角标图的前身（角标由源图画出，源图变化必然导致生成物变化，所以"生成物 == 源图"等价于"上次生成时源图未变"这一近似判断够用；更严谨可比较源图 shasum 与记录值）。

## 手写 Info.plist（GENERATE_INFOPLIST_FILE = NO）时的显示名

Info.plist 文件本身不能按配置区分，用 build setting 变量注入：

- Info.plist 里：`<key>CFBundleDisplayName</key><string>$(DEV_DISPLAY_NAME)</string>`
- Debug 配置：`DEV_DISPLAY_NAME = MyApp Dev`
- Release 配置：`DEV_DISPLAY_NAME = MyApp`

## xcconfig 项目

配置集中在 .xcconfig 时，在 Debug 对应的 xcconfig 里覆盖（Release 文件不动）：

```
# 仅已授权并存/改 ID 时启用；同 ID 默认方案不加此项
PRODUCT_BUNDLE_IDENTIFIER = com.example.app.dev
INFOPLIST_KEY_CFBundleDisplayName = MyApp Dev
ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon-Dev
```

## 多 target / 扩展

- 只改角标时限定主 app；改 ID 并存时逐项核查 Widget / Share Extension 的 Bundle ID 前缀、签名和 embedding 约束，必要时同步独立 ID。`group.` 是 App Group 标识，不是扩展 Bundle ID 的通用命名规则。
- 检查单元测试的 TEST_HOST/BUNDLE_LOADER、UI 测试的目标应用配置与硬编码 Bundle ID；不能保证测试 target 不受影响。
- CloudKit 环境由签名 entitlement/分发方式和容器配置决定，改 Bundle ID 不自动隔离 Development/Production；同时核查共享容器、App Groups、Keychain。

## 图标生成脚本补充

- 脚本为 node 入口 + macOS swift kernel（`node scripts/make_dev_icon.mjs`，系统自带 node/swift 即可跑）；字体用系统 SF Pro 粗体。
- 正式图若含透明通道：App Store 图标不允许透明，正式图应当已是不透明；脚本会用黑底兜底并打印警告，此时应提醒用户先补底再生成。
- 角标参数：`node make_dev_icon.mjs <input> <output> [label] [style]`，style 支持 `capsule`（白底黑字胶囊）和 `dot`（橙色圆点）。
- 角标样式可按品牌调整：黑底细字类图标用白胶囊黑字对比最强；浅色图标可换成黑胶囊白字，改脚本里两处 fill 颜色即可。
