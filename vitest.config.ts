import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // 技能脚本自带 node:test 文件（node --test 运行），vitest 不扫
    exclude: ["**/node_modules/**", "skills/**"],
  },
});
