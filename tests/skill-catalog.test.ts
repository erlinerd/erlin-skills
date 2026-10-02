import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const BUCKETS = ["workflow", "apple", "web", "garden"];
const META_FILE = path.join(SKILLS_DIR, "workflow/erlin-meta/SKILL.md");
const FLOW_MAP = path.join(SKILLS_DIR, "workflow/erlin-meta/FLOW-MAP.md");

interface Skill {
  name: string;
  bucket: string;
  frontmatter: string;
}

// 技能生命周期五级（对标 mattpocock/skills 的目录进度分类），
// 以 frontmatter maturity 字段承载；四桶目录保持功能语义不变（ADR-0001）。
const MATURITIES = ["engineering", "productivity", "in-progress", "deprecated"];

function listSkills(): Skill[] {
  const skills: Skill[] = [];
  for (const bucket of fs.readdirSync(SKILLS_DIR).sort()) {
    if (bucket.startsWith(".")) continue;
    const bucketPath = path.join(SKILLS_DIR, bucket);
    if (!fs.statSync(bucketPath).isDirectory()) continue;
    if (bucket === "_attic") continue;
    for (const dir of fs.readdirSync(bucketPath).sort()) {
      const skillMd = path.join(bucketPath, dir, "SKILL.md");
      if (!fs.existsSync(skillMd)) continue;
      const frontmatter =
        fs.readFileSync(skillMd, "utf8").match(/^---\n([\s\S]*?)\n---/m)?.[1] ??
        "";
      const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
      expect(name, `${dir}/SKILL.md missing name`).toBeTruthy();
      expect(
        name,
        `Skill directory/name mismatch: ${bucket}/${dir}`,
      ).toBe(dir);
      skills.push({ name: name!, bucket, frontmatter });
    }
  }
  return skills;
}

describe("skill catalog contract", () => {
  const skills = listSkills();
  const names = skills.map((s) => s.name);

  it("keeps the catalog at the expected size", () => {
    expect(skills).toHaveLength(27);
    expect(names.every((n) => n.startsWith("erlin-"))).toBe(true);
  });

  it("requires every skill to declare description and keywords", () => {
    for (const s of skills) {
      expect(
        s.frontmatter.match(/^description:\s*(.+)$/m)?.[1],
        `${s.name} missing description`,
      ).toBeTruthy();
      const kwBlock = s.frontmatter.match(
        /^keywords:[ \t]*\n((?:[ \t]*-[ \t]*.*(?:\n|$))*)/m,
      )?.[1];
      const kwCount = kwBlock
        ? kwBlock.split("\n").filter((l) => l.trim()).length
        : 0;
      expect(kwCount, `${s.name} missing keywords`).toBeGreaterThan(0);
    }
  });

  it("keeps erlin-meta routing table in sync with directories", () => {
    const meta = fs.readFileSync(META_FILE, "utf8");
    const listed = [...meta.matchAll(/\| `([^`]+)` \|/g)].map((m) => m[1]);
    const missing = names.filter((n) => !listed.includes(n));
    const unknown = listed.filter((n) => !names.includes(n));
    expect(
      missing.length === 0 && unknown.length === 0,
      `meta table out of sync (missing: ${missing.join(", ")}; unknown: ${unknown.join(", ")})`,
    ).toBe(true);
  });

  it("keeps FLOW-MAP placements in sync with directories", () => {
    const map = fs.readFileSync(FLOW_MAP, "utf8");
    const unplaced = names.filter((n) => !map.includes(n));
    expect(
      unplaced.length === 0,
      `FLOW-MAP missing placements: ${unplaced.join(", ")}`,
    ).toBe(true);
  });

  it("keeps plugin manifest in sync with directories", () => {
    const plugin = JSON.parse(
      fs.readFileSync(path.join(ROOT, ".claude-plugin/plugin.json"), "utf8"),
    );
    const pluginNames = plugin.skills.map((p: string) => p.split("/").pop());
    expect(pluginNames.sort()).toEqual([...names].sort());
    for (const p of plugin.skills) {
      expect(fs.existsSync(path.join(ROOT, p)), `missing: ${p}`).toBe(true);
    }
  });

  it("keeps bucket READMEs in sync with directories", () => {
    for (const bucket of BUCKETS) {
      const readme = fs.readFileSync(
        path.join(SKILLS_DIR, bucket, "README.md"),
        "utf8",
      );
      for (const dir of fs.readdirSync(path.join(SKILLS_DIR, bucket))) {
        if (!fs.existsSync(path.join(SKILLS_DIR, bucket, dir, "SKILL.md")))
          continue;
        expect(
          readme.includes(dir),
          `${bucket}/README.md missing ${dir}`,
        ).toBe(true);
      }
    }
  });

  it("keeps docs tree mirrored with skills tree", () => {
    for (const s of skills) {
      expect(
        fs.existsSync(path.join(ROOT, "docs", s.bucket, `${s.name}.md`)),
        `docs/${s.bucket}/${s.name}.md missing`,
      ).toBe(true);
    }
  });

  it("keeps openai.yaml invocation mirror in sync with frontmatter", () => {
    for (const s of skills) {
      const yaml = fs.readFileSync(
        path.join(SKILLS_DIR, s.bucket, s.name, "agents/openai.yaml"),
        "utf8",
      );
      const manual =
        /^disable-model-invocation:\s*true$/m.test(s.frontmatter);
      expect(
        yaml.includes(`allow_implicit_invocation: ${!manual}`),
        `${s.name} openai.yaml policy out of sync with frontmatter`,
      ).toBe(true);
      expect(yaml.includes("interface:"), `${s.name} missing interface block`)
        .toBe(true);
    }
  });

  it("keeps core skills bilingual (description starts with English)", () => {
    const core = [
      "erlin-dev-standards",
      "erlin-bdd",
      "erlin-arch-review",
      "erlin-product-review",
      "erlin-app-icon",
      "erlin-app-store-marketing",
      "erlin-app-store-compliance",
      "erlin-asc",
      "erlin-social-assets",
    ];
    for (const s of skills) {
      if (!core.includes(s.name)) continue;
      const desc = s.frontmatter.match(/^description:\s*[>-]*\s*\n?([\s\S]*?)(?=\n[a-z_]+:|\n---)/m)?.[1]?.trim() ?? "";
      expect(
        desc,
        `${s.name} description empty`,
      ).toBeTruthy();
      expect(
        /^[A-Za-z]/.test(desc),
        `${s.name} description must start with English trigger sentence`,
      ).toBe(true);
    }
  });

  it("requires every skill to declare a valid maturity level", () => {
    for (const s of skills) {
      const level = s.frontmatter.match(/^maturity:\s*(\S+)\s*$/m)?.[1] ?? "";
      expect(
        MATURITIES.includes(level),
        `${s.name} has invalid maturity '${level}'`,
      ).toBe(true);
    }
    // deprecated 技能不进 plugin 安装面（现空集，规则先行）
    const plugin = JSON.parse(
      fs.readFileSync(path.join(ROOT, ".claude-plugin/plugin.json"), "utf8"),
    );
    const deprecatedNames = skills
      .filter(
        (s) =>
          s.frontmatter.match(/^maturity:\s*(\S+)\s*$/m)?.[1] === "deprecated",
      )
      .map((s) => `./skills/${s.bucket}/${s.name}`);
    for (const d of deprecatedNames) {
      expect(
        plugin.skills,
        `deprecated skill ${d} must not ship in plugin.json`,
      ).not.toContain(d);
    }
  });

  it("keeps versions consistent across package.json and plugin manifests", () => {    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude-plugin/plugin.json"), "utf8"));
    const market = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude-plugin/marketplace.json"), "utf8"));
    expect(plugin.version).toBe(pkg.version);
    expect(market.version).toBe(pkg.version);
  });

  it("keeps CHANGELOG's latest section version in sync with package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const changelog = fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8");
    const latest = changelog.match(/^## (\d+\.\d+\.\d+)$/m)?.[1];
    expect(latest, "CHANGELOG.md has no '## X.Y.Z' section").toBeTruthy();
    // 防止 tag v1.0.0 与元数据 0.2.0 式的版本分裂（2026-10-02 审计发现）
    expect(latest).toBe(pkg.version);
  });
});
