# workflow

主流程与规范评审——写码纪律、架构/产品评审、测试、自动实验、编排

## Model-invoked

- [erlin-arch-review](./erlin-arch-review/SKILL.md) — 架构评审（diff 合规审查走 code-review）：从单一职责、开闭原则、低耦合、组件复用等七原则评估代码的架构质
- [erlin-auto-research](./erlin-auto-research/SKILL.md) — 数值指标自动实验循环——把"优化一个可复现的数字"变成无人值守试错循环（基线定噪声闸门 → 每轮一假设一改动 → 变好保
- [erlin-bdd](./erlin-bdd/SKILL.md) — BDD 测试规范（Web + Apple 双平台）：场景规格统一 Markdown（docs/bdd/*.md）；Web
- [erlin-dev-standards](./erlin-dev-standards/SKILL.md) — 写代码时的通用工程规范（任何语言任何项目）——改动前先读、最小切口、证据闭环、失败不静默。动手写或改代码前、准备声称“完
- [erlin-meta](./erlin-meta/SKILL.md) — 轻量技能路由：维护 hook 高频入口与仓库目录校验表。用户问有哪些技能、该用哪个技能或任务主意图不明确时使用；先利用宿
- [erlin-product-review](./erlin-product-review/SKILL.md) — 从产品、UX、增长、商业四视角对产品/功能/版本/落地页做证据驱动的系统评估，输出评估卡 + 按影响×成本排序的行动清单
- [erlin-safe-delete](./erlin-safe-delete/SKILL.md) — 本机文件/目录/缓存的删除纪律——删除前先列清单（路径+实测大小）请用户确认，批准后移入废纸篓而不是直接删；适用于用户资

## User-invoked

- [erlin-autopilot](./erlin-autopilot/SKILL.md) — 多任务并行编排——Inspect→分类→Spec→垂直切片→依赖图→选执行后端（有编排器用编排器，否则原生 worktr（仅用户显式调用）

