# erlin-obsidian-wiki

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

在 Obsidian vault 里按 Karpathy 的 LLM Wiki pattern、用官方 obsidian CLI 增量编译并维护互链知识库——"收进 wiki/查 wiki/整理 wiki/llm wiki"时使用，即使用户没提 Karpathy 三个字。

## When to reach for it

三类请求——Ingest（把新源料编译进 wiki）、Query（对 wiki 提问并把好答案回填成页）、Lint（健康检查）；目标库默认 ~/Obsidian/Obsidian Vault。与 erlin-profile 分工：~/.me 存个人属性事实，本技能建主题知识库。

## Common questions

- **Ingest/Query/Lint 分别做什么？**

  Ingest 收材料进 wiki；Query 查已有条目；Lint 查断链/重复/结构违规。

## It's working if

- Ingest 后新条目进入 wiki 且与既有条目互链，不是孤立笔记。
- Query 拿到基于 wiki 现有条目的回答，好答案被回填成页。
- Lint 报告断链/重复/结构违规清单，处理后复检归零。
