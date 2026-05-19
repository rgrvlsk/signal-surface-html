#!/usr/bin/env node
import { resolve, join } from "node:path";
import { readFile } from "node:fs/promises";
import { ensureDir, parseArgs, writeJson } from "./lib/project.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = args._[0] ? resolve(args._[0]) : null;
const inputPath = args._[1] ? resolve(args._[1]) : null;

if (!projectRoot || !inputPath) {
  console.error("Usage: import-feedback.mjs <surface-project> <feedback.txt|json>");
  process.exit(1);
}

const raw = await readFile(inputPath, "utf8");
const payload = parseFeedback(raw);
const outputFile = join(projectRoot, "feedback/imported-feedback.json");

await ensureDir(join(projectRoot, "feedback"));
await writeJson(outputFile, payload);

process.stdout.write(`${JSON.stringify({ projectRoot, outputFile })}\n`);

function parseFeedback(rawText) {
  const match = rawText.match(/SIGNAL_SURFACE_FEEDBACK_START\s*([\s\S]*?)\s*SIGNAL_SURFACE_FEEDBACK_END/);
  const jsonText = match ? match[1] : rawText;
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return {
      importedAt: new Date().toISOString(),
      rawText,
      parseError: error.message
    };
  }
}
