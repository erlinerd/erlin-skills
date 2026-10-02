# Invocation 规则

每个 SKILL.md 二选一，且由两处元数据共同声明：

- **model-invoked**（默认）：模型可按 description 自动调用。`agents/openai.yaml` 写 `policy.allow_implicit_invocation: true`。
- **user-invoked**：仅用户显式调用。frontmatter 加 `disable-model-invocation: true`（宿主硬开关），openai.yaml 镜像写 `false`。当前 3 个：`erlin-asc`（写 ASC）、`erlin-autopilot`（批量编排）、`erlin-feishu-wiki`（整篇覆盖远程 wiki）。

**一致性约束**：frontmatter 是权威源，openai.yaml 是镜像；`skill-metadata.test.ts` 校验镜像不漂移（列 user-invoked 的表项必须有 frontmatter 开关）。新增 user-invoked 技能必须两处同改，并同步 erlin-meta 路由表的「手动边界」。

CLAUDE.md 与 AGENTS.md 绝不并存（matt 规则）：本仓库只有 AGENTS.md，各宿主经 symlink 读取。
