import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const fixturesDir = join(root, "fixtures");
const createScript = join(root, "surface-kit/scripts/create-surface-project.mjs");
const renderScript = join(root, "surface-kit/scripts/render-surface.mjs");
const out = mkdtempSync(join(tmpdir(), "surface-signal-html-fixtures-"));
const results = [];

for (const file of readdirSync(fixturesDir).filter((name) => name.endsWith(".json")).sort()) {
  const fixture = join(fixturesDir, file);
  const created = run([createScript, fixture, "--out", out]);
  const rendered = run([renderScript, created.projectRoot]);
  const html = readFileSync(rendered.outputFile, "utf8");

  if (/<(script|link|img|iframe)\b[^>]+(?:src|href)=["']https?:\/\//i.test(html)) {
    throw new Error(`${file} rendered an external runtime URL`);
  }
  if (/(mermaid\.initialize|mermaidAPI|chart\.js\/auto|new Chart\()/i.test(html)) {
    throw new Error(`${file} leaked a heavy visual runtime`);
  }

  results.push({ fixture: file, outputFile: rendered.outputFile, sourceHash: rendered.sourceHash });
}

await rm(out, { recursive: true, force: true });
process.stdout.write(`${JSON.stringify({ rendered: results }, null, 2)}\n`);

function run(args) {
  const result = spawnSync("node", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
  return JSON.parse(result.stdout);
}
