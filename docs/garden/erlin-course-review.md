# erlin-course-review

> **Archived**：已并入 [erlin-course](./erlin-course.md)（评审模式）。本页保留历史记录。
> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

严格评审课程/课件——按通用课程标准（QM 8 大类、OSCQR、Bloom 修订版、逆向设计对齐、Gagné 九事件、Mayer 多媒体原则）给出过/不过三档判决和 P0/P1/P2 分级问题清单。评课、审课、课件验收、上线前把关、写完课件自审时使用——即使没点名 skill。与 erlin-course-create 配套：那个管写之前，这个管写完之后。

## When to reach for it

用户要求评课/审稿/验收/检查课程质量、课程上线前把关、写完一节课或一条课程线需要自审时使用。不评代码实现质量（erlin-dev-standards / erlin-arch-review 管辖），不评 UI 视觉品味（emil-design-eng 管辖），不做个人学习计划（erlin-learning-plan 管辖）。

## Common questions

- **什么情况一票否决？**

  目标-评估对齐失败：评估考的不是目标教的。

- **P0/P1/P2 怎么分？**

  P0 阻断上线，P1 影响学习效果应修，P2 打磨项。

## It's working if

- 拿到明确三档判决（过/有条件过/不过），不存在"大体不错"式模糊收尾。
- 问题清单按 P0/P1/P2 分级，P0 阻断项一一对应上线风险。
- 目标-评估对齐被实际核对过：评估考的确实是目标教的，对不齐直接一票否决。
