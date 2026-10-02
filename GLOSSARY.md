# GLOSSARY — erlin-skills

领域词汇单一权威源。agent 在命名输出（issue 标题、重构提案、测试名、技能描述）时使用此处定义的术语，不漂移到本表明确避开的同义词。新术语或歧义消解由 `domain-modeling` 流程沉淀至此。

| 术语 | 定义 |
| --- | --- |
| skill | `SKILL.md` 定义的可复用工作流单元；触发与调用模式以 frontmatter 为权威源 |
| bucket（桶） | skills 目录的一级分组：`workflow` / `apple` / `web` / `garden`；退役桶 `_attic` 不参与安装与路由 |
| model-invoked | 模型可依据 description 自动调用的技能 |
| user-invoked | 仅用户显式调用（斜杠命令/点名）的技能；由 frontmatter `disable-model-invocation: true` 硬声明 |
| erlin-* | 现行技能体系命名空间；前缀是宿主目录列表里的视觉命名空间，与桶正交 |
| FLOW-MAP | `skills/workflow/erlin-meta/FLOW-MAP.md`：主流程/汇入流/词汇层/独立件的流程地图；与桶正交（桶是目录分组，地图是流程分组） |
| 三向校验 | 目录 ↔ erlin-meta 路由表 ↔ FLOW-MAP 落位的机器核对（vitest 套件执行） |
| promoted | 进入安装面（link-skills.sh 遍历）与 plugin 发布面的在役技能全集；`_attic` 与 deprecated 除外 |
| plugin 面 | `.claude-plugin/` 清单：别人可通过 Claude Code marketplace 安装本仓库技能 |
| changeset | 版本变更记录文件；改技能/布局行为必须附一个 changeset，release 时聚合成版本与 CHANGELOG |
| skill isolation | 外部体系（superpowers/gstack 等）技能指令与本仓库冲突时，本仓库优先 |
| deprecated | frontmatter `status: deprecated`；豁免路由表必须性，`replaced_by` 指向继任技能 |
