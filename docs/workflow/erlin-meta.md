# erlin-meta

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

轻量技能路由：维护高频入口速查表与仓库目录校验表。用户问有哪些技能、该用哪个技能或任务主意图不明确时使用；先利用宿主技能描述，不要求每次开发都加载完整目录。

## When to reach for it

需要技能选择、工程流或 App Store 子域分流时参考；先使用宿主技能描述与高频入口速查表，明确的小修无需读取完整目录。

## Common questions

- **我不知道该用哪个技能怎么办？**

  直接问"有哪些技能/该用哪个"，会命中它；它按目标选主技能，不加载全目录。

- **App Store 相关任务怎么分流？**

  它内置"App Store 子域分流"：拒审整改→compliance，截图→marketing，物料→icon/dev-build。

## It's working if

- 拿到的是一个主技能选择（+ 必要的补充技能），而不是整个目录倾倒。
- 说"做截图"命中 erlin-app-store-marketing、说"架构评估"命中 erlin-arch-review——路由结果与任务目标对得上。
- App Store 任务被正确分流：拒审整改、截图、商店文案各走各的技能。
