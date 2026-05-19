#!/usr/bin/env node
import { resolve, join } from "node:path";
import {
  computeSourceHash,
  defaultAppJsx,
  defaultTempRoot,
  defaultThemeCss,
  ensureDir,
  normalizeDocument,
  parseArgs,
  readJson,
  safeArtifactId,
  writeJson,
  writeText
} from "./lib/project.mjs";

const args = parseArgs(process.argv.slice(2));
const inputPath = args._[0];

if (!inputPath) {
  console.error("Usage: create-surface-project.mjs <spec.json> [--out /tmp/surface-signal-html]");
  process.exit(1);
}

const spec = await readJson(resolve(inputPath));
const artifactId = safeArtifactId(spec);
const baseOut = resolve(args.out || defaultTempRoot);
const projectRoot = join(baseOut, artifactId);
const now = new Date().toISOString();

await ensureDir(projectRoot);
await ensureDir(join(projectRoot, "src/content"));
await ensureDir(join(projectRoot, "src/data"));
await ensureDir(join(projectRoot, "src/assets"));
await ensureDir(join(projectRoot, "feedback"));
await ensureDir(join(projectRoot, "dist"));

const document = normalizeDocument(spec);
await writeJson(join(projectRoot, "src/document.json"), document);
await writeText(join(projectRoot, "src/theme.css"), spec.themeCss || defaultThemeCss());
await writeText(join(projectRoot, "src/app.jsx"), spec.appJsx || defaultAppJsx());

if (spec.content && typeof spec.content === "object") {
  for (const [name, value] of Object.entries(spec.content)) {
    await writeText(join(projectRoot, "src/content", name), String(value));
  }
}

if (spec.data && typeof spec.data === "object") {
  for (const [name, value] of Object.entries(spec.data)) {
    await writeJson(join(projectRoot, "src/data", name), value);
  }
}

const surface = {
  artifactId,
  artifactType: spec.artifactType || "surface-signal-html",
  title: spec.title || artifactId,
  summary: spec.summary || "",
  freshSessionContext: spec.freshSessionContext || "",
  capabilities: {
    editText: Boolean(spec.capabilities?.editText),
    addRemoveItems: Boolean(spec.capabilities?.addRemoveItems),
    reorderItems: Boolean(spec.capabilities?.reorderItems),
    comments: spec.capabilities?.comments !== false,
    decisions: spec.capabilities?.decisions !== false
  },
  projectRoot,
  generatedAt: now,
  sourceHash: ""
};

surface.sourceHash = await computeSourceHash(projectRoot);
await writeJson(join(projectRoot, "surface.json"), surface);

process.stdout.write(`${JSON.stringify({
  projectRoot,
  artifactId,
  artifactType: surface.artifactType,
  sourceHash: surface.sourceHash
})}\n`);
