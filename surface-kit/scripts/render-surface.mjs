#!/usr/bin/env node
import { build } from "esbuild";
import { readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeSourceHash,
  ensureDir,
  parseArgs,
  readJson,
  writeJson
} from "./lib/project.mjs";
import { resolveSurfaceIcons } from "./lib/icons.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = args._[0] ? resolve(args._[0]) : null;

if (!projectRoot) {
  console.error("Usage: render-surface.mjs <surface-project>");
  process.exit(1);
}

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = resolve(kitRoot, "..");
const surfacePath = join(projectRoot, "surface.json");
const documentPath = join(projectRoot, "src/document.json");
const themePath = join(projectRoot, "src/theme.css");
const runtimePath = join(pluginRoot, "surface-kit/runtime/main.jsx");
const runtimeCssPath = join(pluginRoot, "surface-kit/runtime/styles.css");
const buildDir = join(projectRoot, ".surface-build");
const distDir = join(projectRoot, "dist");
const outputFile = join(distDir, "index.html");

const surface = await readJson(surfacePath);
const document = await readJson(documentPath);
const themeCss = await readFile(themePath, "utf8").catch(() => "");
const runtimeCss = await readFile(runtimeCssPath, "utf8");
const sourceHash = await computeSourceHash(projectRoot);
const generatedAt = new Date().toISOString();
const icons = await resolveSurfaceIcons();

surface.sourceHash = sourceHash;
surface.generatedAt = generatedAt;
surface.projectRoot = projectRoot;
await writeJson(surfacePath, surface);

await ensureDir(buildDir);
await ensureDir(distDir);

const data = { surface, document, icons };
await writeJson(join(buildDir, "data.json"), data);
await writeFile(
  join(buildDir, "entry.jsx"),
  [
    `import { mountSurface } from ${JSON.stringify(runtimePath)};`,
    "import data from './data.json';",
    "mountSurface(data);",
    ""
  ].join("\n")
);

const result = await build({
  entryPoints: [join(buildDir, "entry.jsx")],
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

const script = result.outputFiles[0].text.replaceAll("</script", "<\\/script");
const css = `${runtimeCss}\n${themeCss}`;
const html = [
  "<!doctype html>",
  "<html lang=\"en\" data-surface-signal-output=\"compiled\">",
  "<head>",
  "  <meta charset=\"utf-8\">",
  "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
  `  <title>${escapeHtml(surface.title)}</title>`,
  "  <style>",
  css,
  "  </style>",
  "</head>",
  "<body>",
  "  <div id=\"app\"></div>",
  "  <script>",
  script,
  "  </script>",
  "</body>",
  "</html>",
  ""
].join("\n");

await writeFile(outputFile, html);
await rm(buildDir, { recursive: true, force: true });

process.stdout.write(`${JSON.stringify({
  projectRoot,
  outputFile,
  sourceHash,
  gzipBytes: null
})}\n`);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
