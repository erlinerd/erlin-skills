# erlin-web-lan-preview

> **Archived**：serve_lan.mjs 已并入 [erlin-social-assets](./erlin-social-assets.md)。本页保留历史记录。
> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

把图片/物料目录变成局域网可看的预览服务——一条命令起服务、自动生成画廊首页、后台常驻、可列出/停止。用户提到"局域网看图""手机看图""LAN 预览""开个服务看""serve images""物料预览""二维码看图"时使用——即使没提 skill 名。

## When to reach for it

把图片/物料目录一键变成局域网可看的预览画廊——起服务、报 URL、手机同 Wi-Fi 查看、用完即停时使用；提及"局域网看图/手机看图/LAN 预览/物料预览"即触发。

## Common questions

- **手机怎么访问？**

  起服务后自动出二维码/局域网 URL，同网手机直接看。

- **怎么停？**

  提供列表/停止命令，后台常驻可随时管理。

## It's working if

- 一条命令起服务，终端给出局域网 URL/二维码，同 Wi-Fi 手机打开即见画廊。
- 物料目录里所有图片在首页画廊可见，无需逐个点链接。
- 用完能列出并停止服务，后台不留僵尸进程。
