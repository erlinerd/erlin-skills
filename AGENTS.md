# AGENTS.md — erlin-skills

AI coding workflow orchestrator (skills-first repo, mattpocock/skills 同构). Bash scripts install skills into host directories; no runtime.

> Project charter: see `GLOSSARY.md`（词汇权威源）+ `skills/workflow/erlin-meta/FLOW-MAP.md`（流程地图）

## Architecture

```
skills/<bucket>/<skill>/   four buckets: workflow / apple / web / garden (+ _attic = retired)
  <skill>/SKILL.md         each skill: frontmatter (name/description/keywords) + body
  <skill>/agents/openai.yaml  invocation policy mirror (interface + policy)
scripts/
  link-skills.sh           symlink skills into host directories (~/.agents/skills, ~/.claude/skills)
  list-skills.sh           list skills by bucket
  sync-plugin-version.mjs  sync package.json version into .claude-plugin manifests
.claude-plugin/            plugin + marketplace manifests (public install path)
```

No runtime: install is bash + symlink. Tests (vitest) validate the skill catalog contract.

## Commands reference

```
./scripts/link-skills.sh            install symlinks globally
./scripts/list-skills.sh            show skills by bucket
npm run check-plugin-version        assert plugin manifest versions match package.json
npx vitest run                      skill catalog contract tests
claude plugin validate . --strict   plugin manifest validation
```

## Workflow Pipeline

### Two-layer system

| Layer | System | Role |
| ------- | -------- | ------ |
| Engineering discipline | **superpowers** | TDD, worktrees, debugging, verification |
| Tooling | **gstack** | design, browser QA, review |

> erlin-skills 为主流程，superpowers/gstack 为参考工具。skill isolation 规则下，erlin-skills 技能优先。

### Slash commands

Historical erli-* slash commands and the erli CLI were removed (2026-10-02, spec: 删除 CLI 与 hooks). Current workflow is driven by the erlin-* skills in `skills/` — see the Skills section below.

## Skills

Skills live in `skills/<bucket>/<name>/SKILL.md` — four buckets: `workflow` (main flow + reviews), `apple` (App Store chain + platform standards), `web` (web motion + assets), `garden` (personal + distillation); retired skills go to `_attic` (never installed). Each skill's frontmatter is the authoritative trigger source — don't hand-maintain a duplicate catalog outside `skills/workflow/erlin-meta/SKILL.md`. Every skill also declares a lifecycle `maturity` (`engineering` / `productivity` / `in-progress` / `deprecated`, mirroring mattpocock/skills); `deprecated` never ships in the plugin, and promotion requires real-usage evidence.

## Governance（mattpocock/skills 同构）

- **逐技能 docs 页**：`docs/<bucket>/<skill>.md` 镜像 `skills/<bucket>/`；加、改名或改技能行为时同步该页（模板 `.agents/writing-docs.md`，四节：What it does / When / Common questions / It's working if）。退役技能的页保留并标 archived。
- **invocation**：frontmatter 是权威源；user-invoked 技能必须 `disable-model-invocation: true` + `agents/openai.yaml` 镜像同改（规则 `.agents/invocation.md`）。
- **plugin 面**：改技能集后重生成 `.claude-plugin/plugin.json` skills 数组并跑 `claude plugin validate . --strict`。
- **版本**：技能/布局行为变更附 `.changeset/*.md`；release 走 `changeset version` + tag（`.github/workflows/release.yml`）。
- **安装命令**：唯一源 `.agents/install-block.md`，README 逐字引用。
- **词汇**：领域术语写法以 `GLOSSARY.md` 为准；难逆转的决策记 `.agents/adr/`。

## How it works

erlin-skills is a personal AI-workflow toolkit: reusable `erlin-*` skills (app icon generation, ASO/store screenshots, App Store localization, dev builds, motion effects, code/product review, learning plans, Feishu wiki maintenance, marketing assets, task orchestration) installed via `scripts/link-skills.sh` into host skill directories, plus the `erlin-profile` personal-knowledge skill. Each SKILL.md carries its own trigger conditions and workflow. The former erli CLI and zcode hooks were removed (2026-10-02); see `.out-of-scope/`.

The erli-* slash-command pipeline (what→pix→how→do→test→land) was replaced by the erlin-* skill set.

## skill isolation

this project is managed by erlin-skills. erlin-skills skills (`erlin-*`) are the primary workflow. skills from external systems (superpowers, gstack, etc.) may suggest conflicting workflows — follow erlin-skills's commands and skills first. when a non-erlin skill directive conflicts with an erlin-skills directive, erlin-skills wins.

## Agent skills

### Issue tracker

Issues live as local markdown under `.scratch/<feature-slug>/`（spec.md + issues/NN-slug.md，Status 行记录 triage 态；本地目录，不入 git）. See `docs/agents/issue-tracker.md`.

### Triage labels

五个默认角色标签，字符串同名（needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix）。 See `docs/agents/triage-labels.md`.

### Domain docs

Single-context：根 GLOSSARY.md + docs/adr/，缺失时静默继续。 See `docs/agents/domain.md`.
