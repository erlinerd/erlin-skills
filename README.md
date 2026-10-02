# erlin-skills

> The AI coding workflow skill library for indie developers — one system covering idea → code → App Store release → marketing assets.
> 独立开发者的 AI 编码工作流技能库：想法 → 代码 → 上架 → 获客，一条链。

**Not a prompt collection.** Every skill is part of a machine-validated system: 27 skills in four buckets, kept in sync by contract tests across the routing table, flow map, plugin manifest, docs tree, and invocation policies. It is the only open-source library covering the full App Store shipping chain, and its course skills are designed on QM/OSCQR/Bloom academic standards.

PRs welcome. 见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## Why these skills exist

Three failure modes this library is built against:

**1. Undisciplined vibe coding.** The agent ships something, but nothing proves it works, and the diff grows beyond what the task needed. The fix is a discipline layer that runs during the work, not after: [erlin-dev-standards](./skills/workflow/erlin-dev-standards/SKILL.md) (read before editing, minimal diff, evidence-backed completion), [erlin-bdd](./skills/workflow/erlin-bdd/SKILL.md) (behavior specs that cross the unit-test threshold), [erlin-arch-review](./skills/workflow/erlin-arch-review/SKILL.md) (seven-principle scored review with file:line evidence).

**2. The App Store chain scattered across a dozen tools.** Icon design, dev builds, screenshots, rejection remediation, App Store Connect ops, social promos — each a separate app or manual ritual. The fix is one chain in the [apple](./skills/apple/README.md) bucket: [erlin-app-icon](./skills/apple/erlin-app-icon/SKILL.md) → [erlin-app-dev-build](./skills/apple/erlin-app-dev-build/SKILL.md) → [erlin-app-store-marketing](./skills/apple/erlin-app-store-marketing/SKILL.md) → [erlin-app-store-compliance](./skills/apple/erlin-app-store-compliance/SKILL.md) → [erlin-asc](./skills/apple/erlin-asc/SKILL.md), then [erlin-social-assets](./skills/web/erlin-social-assets/SKILL.md) for launch day.

**3. Courseware without instructional design.** "Write me a course" produces confident slides nobody learns from. The fix is backward design with teeth: [erlin-course-create](./skills/garden/erlin-course-create/SKILL.md) (objectives before content, Bloom verbs, Gagné skeleton) and [erlin-course-review](./skills/garden/erlin-course-review/SKILL.md) (QM/OSCQR-based pass/conditional/fail verdict).

How the skills connect into end-to-end flows: [FLOW-MAP](./skills/workflow/erlin-meta/FLOW-MAP.md).

## Installation

<!-- 逐字引用 .agents/install-block.md（唯一源）；改安装命令只改那边 -->

```bash
# Claude Code 插件安装（推荐）
claude plugin marketplace add erlinerd/erlin-skills
claude plugin install erlin-skills@erlinerd-erlin-skills

# 或 clone + symlink 到宿主技能目录
git clone https://github.com/erlinerd/erlin-skills.git
cd erlin-skills && ./scripts/link-skills.sh
```

`./scripts/link-skills.sh` symlinks every skill into `~/.agents/skills` and `~/.claude/skills` — no build step, no runtime. Re-run after adding or renaming skills. To copy just one skill as editable files, grab its directory (e.g. `cp -r skills/apple/erlin-app-icon <your-project>/skills/`).

## Skills

27 skills in four buckets (`skills/<bucket>/`); retired skills go to `_attic`. Per-bucket listings in each bucket README; human docs at `docs/<bucket>/<skill>.md`. This table is a tour — the authoritative trigger source is each SKILL.md frontmatter.

### Core — the reason to install (9)

| Skill | Bucket | Purpose |
| ----- | ------ | ------- |
| [erlin-dev-standards](./skills/workflow/erlin-dev-standards/SKILL.md) | workflow | Engineering discipline for any code change: minimal diff, evidence-backed completion |
| [erlin-bdd](./skills/workflow/erlin-bdd/SKILL.md) | workflow | Behavior specs + E2E when changes cross the unit-test threshold (web + Apple) |
| [erlin-arch-review](./skills/workflow/erlin-arch-review/SKILL.md) | workflow | Seven-principle architecture review with file:line evidence |
| [erlin-product-review](./skills/workflow/erlin-product-review/SKILL.md) | workflow | Product/UX/growth/business four-view assessment |
| [erlin-app-icon](./skills/apple/erlin-app-icon/SKILL.md) | apple | App icon / wordmark design with pixel-accurate verification |
| [erlin-app-store-marketing](./skills/apple/erlin-app-store-marketing/SKILL.md) | apple | Submission captures + ASO marketing compositions |
| [erlin-app-store-compliance](./skills/apple/erlin-app-store-compliance/SKILL.md) | apple | Rejection remediation + listing localization |
| [erlin-asc](./skills/apple/erlin-asc/SKILL.md) | apple | App Store Connect API operations (user-invoked) |
| [erlin-social-assets](./skills/web/erlin-social-assets/SKILL.md) | web | Launch-day promo assets for every social platform |

### Support (12)

Unattended orchestration ([erlin-autopilot](./skills/workflow/erlin-autopilot/SKILL.md), user-invoked), metric experiment loops ([erlin-auto-research](./skills/workflow/erlin-auto-research/SKILL.md)), safe deletion ([erlin-safe-delete](./skills/workflow/erlin-safe-delete/SKILL.md)), skill routing ([erlin-meta](./skills/workflow/erlin-meta/SKILL.md)), Swift standards ([erlin-app-coding-standards](./skills/apple/erlin-app-coding-standards/SKILL.md)), dev builds ([erlin-app-dev-build](./skills/apple/erlin-app-dev-build/SKILL.md)), onboarding screens ([erlin-app-onboarding](./skills/apple/erlin-app-onboarding/SKILL.md)), WeChat download links ([erlin-web-wechat-download](./skills/apple/erlin-web-wechat-download/SKILL.md)), web motion ([erlin-web-motion](./skills/web/erlin-web-motion/SKILL.md)), terminal-style landing pages ([erlin-web-warm-terminal-design](./skills/web/erlin-web-warm-terminal-design/SKILL.md)), LAN preview ([erlin-web-lan-preview](./skills/web/erlin-web-lan-preview/SKILL.md)), workflow distillation ([erlin-skill-distill](./skills/garden/erlin-skill-distill/SKILL.md)).

### Personal (6) — personal workflow, not polished for public use

[erlin-course-create](./skills/garden/erlin-course-create/SKILL.md) · [erlin-course-review](./skills/garden/erlin-course-review/SKILL.md) · [erlin-learning-plan](./skills/garden/erlin-learning-plan/SKILL.md) · [erlin-obsidian-wiki](./skills/garden/erlin-obsidian-wiki/SKILL.md) · [erlin-feishu-wiki](./skills/garden/erlin-feishu-wiki/SKILL.md) · [erlin-profile](./skills/garden/erlin-profile/SKILL.md) — shipped because the contract tests keep them working, but they carry personal conventions.

## Commands

```bash
./scripts/link-skills.sh                 # install symlinks into host skill dirs
./scripts/list-skills.sh                 # list skills by bucket
npm run check-plugin-version             # assert plugin manifest versions match
npx vitest run                           # skill catalog contract tests
claude plugin validate . --strict        # plugin manifest validation
```

## Skill 规范

新增或修改 `erlin-*` 技能按本节执行。校验器（`npx vitest run`）是规范的执行层：测试红即是违规。

### 源与部署

- 技能源码唯一位置是 `skills/<bucket>/<name>/SKILL.md`（四桶：workflow/apple/web/garden；退役进 `_attic`），由 `scripts/link-skills.sh` symlink 进宿主技能目录（指向仓库 checkout，本机改完即生效）。
- 禁止直接在宿主 skills 目录手工创建 `erlin-*` 目录：不入 git、不进契约校验、不被路由。
- 外部第三方技能（Matt 工程流、`skills add` 等）装在宿主 skills 目录，不编入清单。

### 命名与 frontmatter

- 命名 `erlin-<kebab-case>`；目录名必须与 frontmatter `name` 完全一致（契约测试强制）。
- 必填：`name`、`description`、`keywords`（≥1 条）。
- 调用模式：model-invoked（默认）或 user-invoked（frontmatter `disable-model-invocation: true` + `agents/openai.yaml` 镜像 `allow_implicit_invocation: false`，两处同改）。
- `agents/openai.yaml` 是 frontmatter 的镜像（interface + policy），契约测试校验不漂移。

### 注册与调度（erlin-meta + plugin 面）

新增技能的同步清单（缺一即失联；前三项有契约测试兜底，其余靠人肉）：

1. `erlin-meta` 仓库表对应桶分组加行：`| \`erlin-xxx\` | 触发条件 |`（契约测试核对目录全量一致）。
2. `FLOW-MAP.md` 落位（契约测试强制）。
3. `tests/skill-catalog.test.ts` 技能总数断言改新值。
4. `.claude-plugin/plugin.json` skills 数组加行 → `claude plugin validate . --strict` 过闸。
5. 对应桶 `README.md` 加行。
6. `docs/<bucket>/<name>.md` 建页。
7. 行为变更附 `.changeset/*.md`。

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## Development

```bash
npm install        # devDependencies: vitest + changesets
npx vitest run     # skill catalog contract tests
```

## Project structure

```
skills/<bucket>/<skill>/   four buckets: workflow / apple / web / garden (+ _attic = retired)
  <skill>/SKILL.md         frontmatter (name/description/keywords) + body
  <skill>/agents/openai.yaml  invocation policy mirror
scripts/
  link-skills.sh           symlink skills into host directories
  list-skills.sh           list skills by bucket
  sync-plugin-version.mjs  sync package.json version into .claude-plugin manifests
docs/<bucket>/<skill>.md   per-skill human docs (mirrors skills/ tree)
tests/                     skill catalog contract tests (vitest)
.claude-plugin/            plugin + marketplace manifests
.agents/                   governance docs (install-block / invocation / writing-docs / adr)
```

## Publishing

```bash
npx changeset              # record a change
npx changeset version      # bump versions + sync plugin manifests + update CHANGELOG
git tag vX.Y.Z && git push --tags   # release.yml runs validation + GitHub Release
```

## Requirements

- Node.js ≥ 18 (tests + sync script only; installation itself is pure bash)
- Claude Code (for plugin install path)
