# erlin-app-dev-build

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

给 iOS/macOS 项目生成带 dev 角标的 Debug 开发版——改图标和显示名（加 Dev 后缀），bundle id 默认不变，Release 配置永不动；仅当用户明确要求"双版本共存/改 bundle id"才启用改 id 变体。用户提到"dev 包""开发版""调试版""给 Debug 加 dev 身份/角标图标"时使用——即使没提 skill 名。

## When to reach for it

生成可辨识的 Debug 开发版（默认同 ID 覆盖；并存需不同 Bundle ID）时使用；用户说“dev 包/开发版/调试版/Debug 换个图标/名称/给项目加一套 dev 身份”即触发，无需点名本技能。只有用户明确提出“改 bundle id”“双版本共存”“同一台设备装两个版本”时才进入改 id 变体。

## Common questions

- **Bundle ID 会变吗？**

  默认不变（同 ID 覆盖安装）；要双版本并存才启用改 ID 变体。

- **改了什么？**

  图标加 dev 角标 + 显示名加 Dev 后缀，仅 Release 配置永不动。

## It's working if

- Debug 构建的图标带 dev 角标、显示名带 Dev 后缀——主屏一眼分清开发版和正式版。
- Release 配置零改动：diff 里只有 Debug 变体相关内容。
- 用户没要求改 bundle id 时，安装行为是同 ID 覆盖，不会多出一个"第二 App"。
