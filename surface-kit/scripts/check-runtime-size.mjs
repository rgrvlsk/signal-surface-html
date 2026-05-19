#!/usr/bin/env node
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./lib/project.mjs";

const args = parseArgs(process.argv.slice(2));
const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tempDir = join(pluginRoot, "tmp/runtime-size");
const entryPath = join(tempDir, "entry.jsx");
const forbidden = ["mermaid", "chart.js", "shiki", "uplot", "sortablejs", "marked", "dompurify", "lucide"];

await mkdir(tempDir, { recursive: true });
await writeFile(
  entryPath,
  [
    "import { mountSurface } from '../../surface-kit/runtime/main.jsx';",
    "mountSurface({ surface: { title: 'Size check', capabilities: {} }, document: { sections: [] } });",
    ""
  ].join("\n")
);

const result = await build({
  entryPoints: [entryPath],
  bundle: true,
  write: false,
  minify: true,
  platform: "browser",
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "preact",
  metafile: true,
  logLevel: "silent"
});

const code = result.outputFiles[0].contents;
const inputPaths = Object.keys(result.metafile.inputs);
const forbiddenImports = inputPaths
  .filter((path) => forbidden.some((name) => path.includes(`/node_modules/${name}/`) || path.includes(`node_modules/${name}/`)))
  .sort();
const payload = {
  bytes: code.length,
  gzipBytes: gzipSync(code).length,
  forbiddenImports
};

await rm(tempDir, { recursive: true, force: true });

if (args.json) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
} else {
  process.stdout.write(`runtime: ${payload.bytes} bytes, ${payload.gzipBytes} gzip bytes\n`);
  if (payload.forbiddenImports.length) {
    process.stdout.write(`forbidden imports:\n${payload.forbiddenImports.join("\n")}\n`);
    process.exitCode = 1;
  }
}
