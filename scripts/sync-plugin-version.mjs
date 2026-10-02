#!/usr/bin/env node
// Sync root package.json version into .claude-plugin manifests (matt 原样思路).
import { readFileSync, writeFileSync } from "node:fs";

const CHECK = process.argv.includes("--check");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const files = [".claude-plugin/plugin.json", ".claude-plugin/marketplace.json"];
let drift = false;

for (const file of files) {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  if (CHECK) {
    if (manifest.version !== pkg.version) {
      console.error(`version drift: ${file} has ${manifest.version}, package.json has ${pkg.version}`);
      drift = true;
    }
    continue;
  }
  manifest.version = pkg.version;
  writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${file} -> ${pkg.version}`);
}
if (drift) process.exit(1);
