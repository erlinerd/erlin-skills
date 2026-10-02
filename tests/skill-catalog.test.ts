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

// 技能生命周期四级（对标 mattpocock/skills 的目录进度分类，较其五桶弃 misc——ADR-0001 否决空桶照搬），
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
    expect(skills).toHaveLength(24);
    expect(names.every((n) => n.startsWith("erlin-"))).toBe(true);
  });

  it("requires every skill to declare description and keywords", () => {
    for (const s of skills) {
      // 兼容单行与 folded (`>-`) 两种形态；folded 时首行只有标点，必须捕获后续正文
      const desc =
        s.frontmatter
          .match(/^description:\s*(?:[>|][-+]*)?\s*\n?([\s\S]*?)(?=\n[a-z_]+:|$)/m)?.[1]
          ?.replace(/\n\s+/g, " ")
          .trim() ?? "";
      expect(
        desc.length,
        `${s.name} description missing or too short`,
      ).toBeGreaterThan(40);
      const kwBlock = s.frontmatter.match(
        /^keywords:[ \t]*\n((?:[ \t]*-[ \t]*.*(?:\n|$))*)/m,
      )?.[1];
      const kwCount = kwBlock
        ? kwBlock.split("\n").filter((l) => l.trim()).length
        : 0;
      expect(kwCount, `${s.name} missing keywords`).toBeGreaterThan(0);
      expect(
        s.frontmatter.match(/^when_to_use:\s*\S/m),
        `${s.name} missing when_to_use`,
      ).toBeTruthy();
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
    // 逐小节校验：表自称「分组与目录桶一一对应」，行必须落在自己桶的小节里
    for (const bucket of BUCKETS) {
      // 不带 m 标志：$ 只匹配串尾，否则惰性捕获在每个行尾提前满足
      const section = meta.match(
        new RegExp(`### ${bucket}[^\\n]*\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`),
      )?.[1];
      expect(section, `meta table missing '### ${bucket}' section`).toBeTruthy();
      const rows = [...(section ?? "").matchAll(/\| `([^`]+)` \|/g)].map((m) => m[1]);
      const expected = skills.filter((s) => s.bucket === bucket).map((s) => s.name);
      const misplaced = expected.filter((n) => !rows.includes(n));
      const foreign = rows.filter((n) => !expected.includes(n));
      expect(
        misplaced.length === 0 && foreign.length === 0,
        `meta '${bucket}' section out of sync (misplaced: ${misplaced.join(", ")}; foreign: ${foreign.join(", ")})`,
      ).toBe(true);
    }
  });

  it("keeps FLOW-MAP placements in sync with directories", () => {
    const map = fs.readFileSync(FLOW_MAP, "utf8");
    // 行级反引号捕获，避免短名（erlin-asc 等）被无关子串误满足
    const placed = [...map.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const unplaced = names.filter((n) => !placed.includes(n));
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

  // description 呈现给模型时约 250 字符截断（宿主注入行为）：中文触发词若落在
  // 截断线之后，中文请求就触发不到本技能。契约 = 双语齐备 + 截断窗口内有中文。
  // （旧契约「英文开头」恰是触发词被截断的病根，2026-10-02 对抗审计后反转。）
  it("keeps core skills bilingual with Chinese triggers inside the 250-char window", () => {
    const TRUNCATION_WINDOW = 250;
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
        /[A-Za-z]{4}/.test(desc),
        `${s.name} description must keep its English sentence (bilingual contract)`,
      ).toBe(true);
      expect(
        /[一-鿿]/.test(desc.slice(0, TRUNCATION_WINDOW)),
        `${s.name} description has no Chinese trigger within the first ${TRUNCATION_WINDOW} chars — Chinese requests won't route to it after truncation`,
      ).toBe(true);
    }
  });

  // 全目录兜底：任何技能（不止 core）的 description 前 250 字符都必须含中文——
  // 本仓库用户是中文用户，触发词可见性对每个技能都成立。
  it("keeps Chinese triggers reachable within the truncation window for every skill", () => {
    const TRUNCATION_WINDOW = 250;
    for (const s of skills) {
      const desc =
        s.frontmatter
          .match(/^description:\s*(?:[>|][-+]*)?\s*\n?([\s\S]*?)(?=\n[a-z_]+:|$)/m)?.[1]
          ?.replace(/\n\s+/g, " ")
          .trim() ?? "";
      expect(
        /[一-鿿]/.test(desc.slice(0, TRUNCATION_WINDOW)),
        `${s.name}: description's first ${TRUNCATION_WINDOW} chars contain no Chinese — front-load Chinese trigger words`,
      ).toBe(true);
    }
  });

  // requires 语义 = 正文委托权威/门禁/强制叠加/调用其脚本的技能（边界转交不算）。
  // 契约：① 每个技能必须显式声明（可为空 `[]`，沉默省略视为漏声明）
  //      ② 每个条目必须解析到目录内真实技能。
  it("requires every skill to explicitly declare resolvable requires", () => {
    for (const s of skills) {
      const decl = s.frontmatter.match(
        /^requires:([ \t]*\[\]|[ \t]*\n(?:[ \t]*-[ \t]*\S+.*\n?)+)?/m,
      );
      expect(
        decl,
        `${s.name} missing explicit 'requires:' declaration (use 'requires: []' when there are no cross-skill dependencies)`,
      ).toBeTruthy();
      const items = [
        ...(decl?.[0] ?? "").matchAll(/^[ \t]*-[ \t]*(\S+)[ \t]*$/gm),
      ].map((m) => m[1]);
      for (const item of items) {
        expect(
          names,
          `${s.name} requires unknown skill '${item}'`,
        ).toContain(item);
      }
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
    // 防止 CHANGELOG 最新节与发布版本漂移（2026-10-02 审计：首次发布提交 e42e938 四处元数据误写 1.0.0，与发布意图 0.0.1 分裂，1e05dad 归一）
    expect(latest).toBe(pkg.version);
  });
});
