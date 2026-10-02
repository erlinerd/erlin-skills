#!/usr/bin/env node
/**
 * 检查 .erlin/course 学习计划是否可以交付。
 *
 * 用法：
 *   node check-course.mjs .erlin/course
 *   node check-course.mjs                 # 默认 .erlin/course
 *
 * 失败时返回非零；模板本身含占位符，不要对 assets/*.md 运行本检查。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.argv[2] || ".erlin/course");
const errors = [];
const required = ["00-home.md", "01-plan.md", "02-record.md"];

if (!existsSync(root)) {
  console.error(`✗ course directory not found: ${root}`);
  process.exitCode = 1;
} else {
  const files = readdirSync(root).filter((file) => file.endsWith(".md"));
  for (const file of required) {
    if (!files.includes(file)) errors.push(`${file}: required file missing`);
  }

  const chapters = files
    .map((file) => file.match(/^(\d{2})-(.+)\.md$/))
    .filter((match) => match && Number(match[1]) >= 3)
    .map((match) => ({ file: match[0], number: Number(match[1]), lesson: Number(match[1]) - 2 }));
  chapters.sort((a, b) => a.number - b.number);

  const expected = chapters.map((chapter, index) => index + 3);
  chapters.forEach((chapter, index) => {
    if (chapter.number !== expected[index]) {
      errors.push(`${chapter.file}: chapter numbering is not continuous`);
    }
  });
  if (chapters.length === 0) errors.push("no chapter files found (expected 03-*.md or later)");

  const contents = new Map(files.map((file) => [file, readFileSync(resolve(root, file), "utf8")]));
  const chapterSections = ["本篇导览", "走读路线", "带着读的疑问"];
  for (const chapter of chapters) {
    const content = contents.get(chapter.file) ?? "";
    for (const section of chapterSections) {
      if (!content.includes(section)) {
        errors.push(`${chapter.file}: missing required section ${section}`);
      }
    }
  }
  const placeholder = /<项目名>|<标题>|<slug>|<看板链接>|YYYY-MM-DD|第 XX 篇|<N\+2>|<N>|<路径>|<commit>|<版本>/;
  for (const [file, content] of contents) {
    if (placeholder.test(content)) errors.push(`${file}: unresolved placeholder`);
  }

  for (const [file, content] of contents) {
    const links = [...content.matchAll(/\]\(([^)#]+\.md)(?:#[^)]+)?\)/g)].map((match) => match[1]);
    for (const link of links) {
      // 只校验本地相对链接；http(s) 等外链与以 / 开头的站内绝对路径跳过
      if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith("/")) continue;
      if (!existsSync(resolve(root, link))) errors.push(`${file}: dead local link ${link}`);
    }
  }

  for (const chapter of chapters) {
    for (const indexFile of ["00-home.md", "01-plan.md"]) {
      if (!contents.get(indexFile)?.includes(`](${chapter.file})`)) {
        errors.push(`${indexFile}: missing link to ${chapter.file}`);
      }
    }
    if (!contents.get("02-record.md")?.includes(`第 ${String(chapter.lesson).padStart(2, "0")} 篇`)) {
      errors.push(`02-record.md: missing progress entry for lesson ${chapter.lesson}`);
    }
  }

  if (errors.length === 0) {
    console.log(`✓ course valid: ${chapters.length} chapter(s), ${files.length} Markdown file(s)`);
  } else {
    for (const error of errors) console.error(`✗ ${error}`);
    process.exitCode = 1;
  }
}
