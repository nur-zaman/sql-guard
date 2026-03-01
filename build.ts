import { $ } from "bun";
import { existsSync, renameSync } from "node:fs";

await $`rm -rf dist`;

const esmResult = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist/esm",
  format: "esm",
  target: "node",
  splitting: false,
  sourcemap: "external",
});

if (!esmResult.success) {
  throw new Error("ESM build failed");
}

const cjsResult = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist/cjs",
  format: "cjs",
  target: "node",
  splitting: false,
  sourcemap: "external",
});

if (!cjsResult.success) {
  throw new Error("CJS build failed");
}

// Rename CJS output from .js to .cjs
if (existsSync("./dist/cjs/index.js")) {
  renameSync("./dist/cjs/index.js", "./dist/cjs/index.cjs");
}

await Bun.write("./dist/cjs/package.json", '{"type":"commonjs"}\n');

await $`tsc --emitDeclarationOnly --outDir ./dist`;

console.log("Build complete!");
console.log("  - dist/esm/index.js (ESM)");
console.log("  - dist/cjs/index.cjs (CJS)");
console.log("  - dist/index.d.ts (Types)");
