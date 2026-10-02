# erlin-app-icon

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

根据产品生成 App 图标/wordmark logo 的完整工作流——品牌色板取色、像素级精确渲染与验证、接入 AppIcon 资源集并构建确认。用户提到"设计 logo""生成 icon/图标""App 图标""上架图标""wordmark""把 XX 作为 icon"时使用，即使没明说。

## When to reach for it

从产品品牌生成 App 图标或 wordmark logo——取品牌色板、像素级渲染与验证、接入 AppIcon 资源集时使用；提及"设计 logo/生成 icon/上架图标/把 XX 作为 icon"即触发。

## Common questions

- **支持什么输入？**

  品牌色板取色或文字描述，输出像素级精确渲染的图标并接入 AppIcon 资源集。

- **怎么验证效果？**

  内置渲染验证 + 构建确认，改完真机能看到新图标。

## It's working if

- 渲染验证通过：图标像素级精确（圆角、边距、网格对齐），不是"看着差不多"。
- 新图标接入 AppIcon 资源集后构建成功，真机/模拟器主屏能看到新图标。
- 配色来自品牌色板且与产品视觉一致，wordmark 清晰可辨。
