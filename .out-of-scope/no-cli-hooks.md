# 不重建 erli CLI 与 zcode hooks

2026-10-02 拍板（spec：删除 CLI 与 hooks）：erli CLI（packages/{core,cli}）与 SessionStart/UserPromptSubmit hooks 属自用基础设施，发布化对齐中整体删除。

- 事实修正（业界对照后）：Claude Code plugin 规范原生支持 hooks 打包（hooks/hooks.json + ${CLAUDE_PLUGIN_ROOT}），obra/superpowers 即此先例——"hooks 进 plugin" 是标准做法。本仓库删除是产品裁剪，不是规范限制。
- 若未来需要会话注入或 CLI，重新开 effort，从本记录起步。
- 路由回归"各技能 frontmatter + 宿主目录"模型（mattpocock/skills 同构）。
- 安装/同步 = scripts/link-skills.sh；目录 = scripts/list-skills.sh。
- 三向校验（目录↔meta 表↔FLOW-MAP）保留为 vitest 契约套件（tests/skill-catalog.test.ts，10 项）。

npm 上历史发布的 @erlin-skills/* 包与本仓库脱钩，未处理。
