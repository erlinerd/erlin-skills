# Contributing to erlin-skills

PRs welcome. New skills and behavior changes must keep the catalog contract green — the contract tests (`npx vitest run`) enforce most of it mechanically.

## Adding a new skill

Seven sync points, in order:

1. **Create** `skills/<bucket>/<skill>/SKILL.md` — pick the bucket by domain (`workflow` engineering, `apple` App Store chain, `web` web/assets, `garden` personal). Frontmatter must include `name` (== directory name), `description`, `keywords` (≥1). Skill body is yours to organize; see existing skills for conventions.
2. **Invocation policy**: create `<skill>/agents/openai.yaml` mirroring the frontmatter (`interface` + `policy`). User-invoked skills also set `disable-model-invocation: true` in frontmatter.
3. **Routing table**: add a row to the bucket group in `skills/workflow/erlin-meta/SKILL.md` — format `` | `erlin-xxx` | trigger description | ``.
4. **Flow map**: add the skill to `skills/workflow/erlin-meta/FLOW-MAP.md` (contract-tested).
5. **Plugin manifest**: add `./skills/<bucket>/<skill>` to `.claude-plugin/plugin.json` `skills` array, then run `claude plugin validate . --strict`.
6. **Bucket README**: add a line to `skills/<bucket>/README.md`.
7. **Docs page**: create `docs/<bucket>/<skill>.md` (four sections: What it does / When to reach for it / Common questions / It's working if — template in `.agents/writing-docs.md`).

Then update the skill-count assertion in `tests/skill-catalog.test.ts`, and attach a changeset (`npx changeset`).

## Changing an existing skill's behavior

Same as adding, minus creating files: sync the meta table row, FLOW-MAP placement, bucket README line, docs page, and attach a changeset.

## Local validation

```bash
npx vitest run                           # catalog contract (10 tests)
claude plugin validate . --strict        # plugin manifest
node scripts/sync-plugin-version.mjs --check   # version consistency
```

All three must pass before opening a PR.

## Conventions

- Skill directories are symlinked into host machines — never break relative references (`references/`, `scripts/`, `assets/` must exist).
- Core skills (the nine in README) keep bilingual descriptions: English trigger sentence first, then 中文.
- Retired skills move to `skills/_attic/` with `status: deprecated` + `replaced_by` in frontmatter; their docs pages stay, marked archived.
- No CLAUDE.md (AGENTS.md is the single steering file, symlinked by hosts). See `.out-of-scope/` for decisions we've ruled out.
