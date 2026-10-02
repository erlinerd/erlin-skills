# erlin-social-assets

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

根据 app 截图与品牌资产生成社交平台宣传物料——Instagram、X、小红书、YouTube、Facebook 等规格的宣传图与可选 Remotion 视频；并内置局域网预览服务（serve_lan.mjs，原 erlin-web-lan-preview 已并入）供手机看图。不负责 App Store 营销构图图；该任务使用 erlin-app-store-marketing。

## When to reach for it

生成社媒宣传物料（宣传图/promo/营销素材/推广图），或要把图片/物料目录变成局域网可看的预览画廊（局域网看图/手机看图/LAN 预览）时使用；用户说“社媒宣传/宣传物料/宣传图/宣传视频/promo/social media/营销素材/推广图”即触发，无需点名本技能。宣传视频默认不生成：只有用户指明要视频或直接要求时才生成，生成前确认竖/横与时长。

## Common questions

- **支持哪些平台规格？**

  Instagram、X、小红书、YouTube、Facebook 等的宣传图，可选 Remotion 视频。

- **局域网预览怎么用？**

  `scripts/serve_lan.mjs <目录>` 一条命令起服务报 URL，手机同 Wi-Fi 打开即看；画廊自动重扫、闲置 10 分钟自动退出、`--stop` 即关。

## It's working if

- 每张宣传图符合目标平台规格（Instagram/X/小红书/YouTube/Facebook），直接可发，不需要手工改尺寸。
- 生成前被确认过竖/横与时长（视频场景），不会未经确认就渲染视频。
- App Store 营销构图没混进来——那类产物走的是 erlin-app-store-marketing。
- 交付时按需给出局域网预览 URL（完整地址，非猜测 IP），看图结束服务被关掉。
