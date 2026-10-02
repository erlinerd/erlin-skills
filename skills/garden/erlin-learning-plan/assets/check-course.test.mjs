#!/usr/bin/env node
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

describe("check-course", () => {
  it("enforces chapter guide sections", () => {
    const checker = new URL("./check-course.mjs", import.meta.url);
    const root = mkdtempSync(join(tmpdir(), "erli-course-check-"));

    try {
      for (const name of ["00-home.md", "01-plan.md", "02-record.md"]) {
        writeFileSync(
          join(root, name),
          name === "00-home.md" || name === "01-plan.md"
            ? "[Chapter](03-basics.md)"
            : "第 01 篇",
        );
      }
      const chapter = join(root, "03-basics.md");
      writeFileSync(
        chapter,
        "# Chapter\n\n## 本篇导览\n\n## 走读路线\n\n## 带着读的疑问\n",
      );

      let result = spawnSync(process.execPath, [checker.pathname, root], {
        encoding: "utf8",
      });
      assert.equal(result.status, 0, `complete course rejected: ${result.stderr}`);

      writeFileSync(chapter, "# Chapter\n\n## 本篇导览\n\n## 走读路线\n");
      result = spawnSync(process.execPath, [checker.pathname, root], {
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0, "missing section was accepted");
      assert.ok(
        result.stderr.includes("带着读的疑问"),
        `missing section was not rejected: ${result.stdout}${result.stderr}`,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // 回归：SKILL.md 要求记录页保留「篇章记录模板」段（内含 YYYY-MM-DD/第 XX 篇占位符），
  // 旧版无差别扫描会把这类合法交付判死。
  it("accepts the template sections a legit record page must keep", () => {
    const checker = new URL("./check-course.mjs", import.meta.url);
    const root = mkdtempSync(join(tmpdir(), "erli-course-check-"));

    try {
      writeFileSync(join(root, "00-home.md"), "[Chapter](03-basics.md)");
      writeFileSync(join(root, "01-plan.md"), "[Chapter](03-basics.md)");
      writeFileSync(
        join(root, "02-record.md"),
        [
          "# 某项目 学习记录",
          "",
          "## 篇章记录模板",
          "",
          "### YYYY-MM-DD · 第 XX 篇 · 标题",
          "",
          "- 学习时基线：`<commit / 版本 / 日期>`",
          "",
          "## 学习日志",
          "",
          "### YYYY-MM-DD · 第 01 篇 · 某标题（示范格式，非真实记录）",
          "",
          "- 实际用时：<分钟>",
          "- 阅读后的结论：真实内容。",
        ].join("\n"),
      );
      writeFileSync(
        join(root, "03-basics.md"),
        "# Chapter\n\n## 本篇导览\n\n## 走读路线\n\n## 带着读的疑问\n",
      );

      const result = spawnSync(process.execPath, [checker.pathname, root], {
        encoding: "utf8",
      });
      assert.equal(result.status, 0, `legit record page rejected: ${result.stdout}${result.stderr}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("still rejects placeholders outside exempt sections", () => {
    const checker = new URL("./check-course.mjs", import.meta.url);
    const root = mkdtempSync(join(tmpdir(), "erli-course-check-"));

    try {
      // 总进度段不在豁免范围，<标题> 应被拦下
      writeFileSync(
        join(root, "02-record.md"),
        ["## 总进度", "", "- [ ] 第 01 篇 · <标题>"].join("\n"),
      );
      const result = spawnSync(process.execPath, [checker.pathname, root], {
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0, "placeholder outside exempt section was accepted");
      assert.match(result.stderr, /02-record\.md: unresolved placeholder/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a leftover kanban placeholder line even after exempt sections", () => {
    const checker = new URL("./check-course.mjs", import.meta.url);
    const root = mkdtempSync(join(tmpdir(), "erli-course-check-"));

    try {
      writeFileSync(
        join(root, "02-record.md"),
        [
          "## 学习日志",
          "",
          "### YYYY-MM-DD · 第 01 篇 · 标题（示范格式，非真实记录）",
          "",
          "- 内容。",
          "",
          "<若已创建看板>进度与复盘看板：[学习进度看板](<看板链接>)",
        ].join("\n"),
      );
      const result = spawnSync(process.execPath, [checker.pathname, root], {
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0, "kanban placeholder line was accepted");
      assert.match(result.stderr, /kanban placeholder/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
