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
});
