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
  // 占位符扫描跳过结构性模板段：SKILL.md 要求交付的记录页保留「篇章记录模板」、
  // 「横向对照记录（适用时）」和一条标注「示范格式」的日志，这些段按设计含占位符，
  // 无差别扫描会把合法交付判死。豁免从命中标题起，到同级或更高级标题为止（含其子标题）。
  const exemptHeading = /模板|示范格式|横向对照记录/;
  const stripExemptSections = (content) => {
    const kept = [];
    let skipLevel = 0;
    for (const line of content.split("\n")) {
      const heading = /^(#{1,6}) (.*)$/.exec(line);
      if (heading) {
        const level = heading[1].length;
        if (skipLevel && level <= skipLevel) skipLevel = 0;
        if (!skipLevel && exemptHeading.test(heading[2])) skipLevel = level;
      }
      if (!skipLevel) kept.push(line);
    }
    return kept.join("\n");
  };
  // 末尾的 <中文…> 通配项兜住清单没枚举到的槽位（<可验证能力>/<关键词>/<分钟>/<时长> 等）
  const placeholder = /<项目名>|<标题>|<slug>|<看板链接>|YYYY-MM-DD|第 XX 篇|<N\+2>|<N>|<路径>|<commit>|<版本>|<[一-龥][^<>\n]*>/;
  for (const [file, content] of contents) {
    if (placeholder.test(stripExemptSections(content))) errors.push(`${file}: unresolved placeholder`);
    // 看板占位行位于示范日志段之后、无标题分隔，会被豁免误跳过；SKILL.md 要求
    // 「未创建看板时先删除看板链接占位行」，故对它单独做全量扫描。
    if (/<看板链接>|<若已创建看板>/.test(content)) {
      errors.push(`${file}: unresolved kanban placeholder（未创建看板应删除该行）`);
    }
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
