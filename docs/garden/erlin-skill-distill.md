# erlin-skill-distill

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

把验证过的工作流提炼成 erlin-* 个人技能，必要元数据与资源引用由仓库现有校验约束，正文按需要组织。用户说"提炼成技能""做成 skill""沉淀一下""这个流程值得记""创建 erlin 技能"时使用——即使没明说 skill;重复出现且已验证的流程可主动评估，单次成功不自动沉淀。

## When to reach for it

把一段验证过、有复用价值的工作流提炼成 erlin-* 技能——先判断值不值得蒸馏，再按实际需要组织正文并落地 SKILL.md 并注册进 erlin-meta 时使用；用户说"提炼成技能/做成 skill/沉淀一下"或重复需求已验证、确有持续复用价值时评估。

## Common questions

- **素材从哪来？**

  真实对话历史：工具调用顺序、用户纠正点、输入输出格式、产物路径。

- **怎么防过拟合？**

  写完用 2-3 个真实提示测触发与输出，过拟合的规则宁删。

## It's working if

- 蒸馏出的 SKILL.md 从真实对话历史取材：工具调用顺序、用户纠正点、输入输出格式都有出处。
- 新技能注册进 erlin-meta 并通过仓库现有校验（目录/frontmatter/镜像一致）。
- 用 2-3 个真实提示实测：该触发的触发、不该触发的不误触，过拟合规则已删。
