---
name: erlin-obsidian-wiki
maturity: in-progress
description: 在 Obsidian vault 里按 Karpathy 的 LLM Wiki pattern、用官方 obsidian CLI 增量编译并维护互链知识库——"收进 wiki/查 wiki/整理 wiki/llm wiki"时使用，即使用户没提 Karpathy 三个字。
when_to_use: 三类请求——Ingest（把新源料编译进 wiki）、Query（对 wiki 提问并把好答案回填成页）、Lint（健康检查）；目标库默认 ~/Obsidian/Obsidian Vault。与 erlin-profile 分工：~/.me 存个人属性事实，本技能建主题知识库。
keywords:
  - obsidian wiki
  - llm wiki
  - karpathy
  - 收进 wiki
  - wiki
---

# 目标

<goal>
在 Obsidian vault 中落地 Karpathy 的 LLM Wiki pattern（gist: karpathy/442a6bf）：LLM 增量编译并持续维护一个互链 markdown 知识库，替代"每次提问重新检索原始文档"的 RAG 模式。知识被编译一次、持续保鲜，而不是每次重推。

三层架构：**raw 源料**（不可变，LLM 只读）/ **wiki 页面**（LLM 全权拥有，用户只读不写）/ **schema 约定**（本技能 + vault 内 `Wiki/SCHEMA.md`）。分工：人负责供料、探索、提问与把关；LLM 负责全部簿记——摘要、交叉引用、归档、账本。Karpathy 原话："Obsidian 是 IDE，LLM 是程序员，wiki 是代码库。"

全部操作经 Obsidian CLI（`/opt/homebrew/bin/obsidian`，`vault=<名>` 指定库），Obsidian 界面实时可见（graph view 看结构）。相邻分工：erlin-profile 存个人属性（~/.me），本技能建主题知识库；删页叠加 erlin-safe-delete。
</goal>

# 执行步骤

<workflow>
1. **初始化（每库一次）**：在 vault 建 `Wiki/`——`Wiki/raw/`（源料区，含 `raw/assets/` 附件）、`Wiki/index.md`（全量目录：每页一行链接+一句话摘要，按类型分组）、`Wiki/log.md`（append-only 账本）、`Wiki/SCHEMA.md`（页面类型与约定，与用户共同演化）。页面类型默认四类：entity（实体）/concept（概念）/source-summary（源料摘要）/synthesis（综合）。既有目录优先复用：`Clippings/` 可作源料投放区，不重复造。
2. **Ingest**：读取 `Wiki/raw/` 新源料 → 与用户对齐要点 → 写 source-summary 页 → 更新受影响的 entity/concept 页（单源可触 10-15 页）→ 更新 `index.md` → `log.md` 追加 `## [YYYY-MM-DD] ingest | <标题>`。默认逐源消化（用户读摘要、把关侧重），批量消化需用户明示。
3. **Query**：先读 `index.md` 定位 → 读相关页 → 带回答成（`obsidian search:context` 兜底全文检索）。**好答案回填为新的 synthesis/comparison 页**——探索成果不消失在聊天记录里，和源料一样让 wiki 复利。
4. **Lint**：定期健康检查，直接用 CLI 现成工具——`obsidian orphans`（孤儿页）、`obsidian unresolved`（断裂 wikilink）、`obsidian deadends`（无出链页）；人工清单：页间矛盾、被新源料取代的过时结论、被多次提及但没建页的概念、可用 web 检索补的空白。Lint 结论落成 log 条目与待办页。
5. **操作通道**：增删改查优先 CLI——`create/append/prepend/read/move/rename/delete`、`search:context`、`links/backlinks`、`property:set`、`tags`；CLI 不覆盖的批量操作直接文件系统读写。引用一律 wikilinks（`[[]]`）。
</workflow>

# 判断规则

<rules>
- **raw 只读**：LLM 永不修改已有源料；新源料入库仅限复制/移动用户指定文件进 `Wiki/raw/`。wiki 层 LLM 全权，用户不手写。
- 每页 YAML frontmatter：`tags` / `date` / `sources`——供 `obsidian tags`、`property:read` 与 Bases/Dataview 查询。
- **规模判断**：约百页内 `index.md` 就是检索入口（先读 index 再钻页），不引入嵌入/RAG/qmd 等依赖，除非用户点名要。
- `log.md` 前缀恒定可 grep：`## [YYYY-MM-DD] <op> | <标题>`——`grep "^## \[" log.md | tail -5` 即最近五条。
- 新建页 vs 更新：主题已在 index 出现 → 更新既有页；新实体/新概念/新综合 → 新建。宁可更新，勿碎片化。
- 版本化：vault 在 git 里则天然有历史；单页回溯用 `obsidian history` / `history:list` / `history:read` / `history:restore`（CLI 无 `history:diff` 子命令；版本内容对比需 `history:read` 导出后自行 diff）。
- 删除或批量重命名 wiki 页面 → 叠加 `erlin-safe-delete`（列清单确认 → 废纸篓）。

| 技能 | 时机 | 职责 |
| --- | --- | --- |
| `erlin-safe-delete` | 删页/批量改名时 | 确认清单 + 废纸篓落地 |
| `erlin-profile` | 个人属性类信息 | ~/.me 存事实，不混进主题 wiki |
| `erlin-skill-distill` | 本技能即其产物 | 新经验回填本技能正文 |
</rules>

# 输出格式

<output-format>
Ingest 报告模板：

```
已收录：<源料标题>
新增页：<页名>（<类型>）…
更新页：<页名>（<改动一句话>）…
index/log：已更新
触达：共 <N> 页
```

Query 回答模板：正文引用一律 `[[页名]]`；结论含不确定性时注明"wiki 尚未覆盖 X"。
</output-format>

# 示例

<example>
<user-request>
「把 Karpathy 那篇 LLM Wiki 的 gist 收进 obsidian wiki」
</user-request>
<tool-returns>
gist 全文（curl raw）、`obsidian create`/`search` 输出、index 当前内容。
</tool-returns>
<final-output>
复制 gist 入 `Wiki/raw/` → 新建 source-summary 页《LLM Wiki pattern 摘要》→ 更新 concept 页《知识管理》（新增"编译 vs 检索"小节）→ index 加两行 → log 追加 ingest 条目 → 报告"新增 1 页、更新 1 页，触达 3 页"。
</final-output>
</example>

# 门禁

<gates>
- raw 只读：对 `Wiki/raw/` 已有文件的任何写操作禁止；新源料入库仅限用户指定的复制/移动。
- 每次 ingest 必须落 `index.md` + `log.md`，缺一即未完成。
- 引用不可造假：wikilink 目标不存在时要么建页、要么明确告知是 unresolved，不许静默留死链。
- 不引入外部检索依赖（qmd/嵌入/RAG）除非用户点名。
- 删页/批量改名走 `erlin-safe-delete`；`SCHEMA.md` 约定变更需用户同意。
- CLI 不可用（Obsidian 未运行等）时降级为直接文件系统操作并如实说明。
</gates>
