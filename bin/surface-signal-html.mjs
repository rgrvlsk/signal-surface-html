#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const commands = {
  create: "surface-kit/scripts/create-surface-project.mjs",
  render: "surface-kit/scripts/render-surface.mjs",
  "import-feedback": "surface-kit/scripts/import-feedback.mjs",
  "check-runtime-size": "surface-kit/scripts/check-runtime-size.mjs"
};

const [command, ...args] = process.argv.slice(2);

if (!command || command === "help" || command === "--help" || command === "-h") {
  printHelp();
  process.exit(command ? 0 : 1);
}

if (command === "contract") {
  const result = spawnSync(process.execPath, ["-e", `
    import { readFileSync } from "node:fs";
    process.stdout.write(readFileSync(${JSON.stringify(join(root, "surface-kit/references/contracts.md"))}, "utf8"));
  `], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

const script = commands[command];
if (!script) {
  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

const result = spawnSync(process.execPath, [join(root, script), ...args], {
  cwd: process.cwd(),
  stdio: "inherit"
});

process.exit(result.status ?? 1);

function printHelp() {
  process.stderr.write(`Surface Signal HTML

Usage:
  surface-signal-html create <spec.json> [--out /tmp/surface-signal-html]
  surface-signal-html render <surface-project>
  surface-signal-html import-feedback <surface-project> <feedback.txt|json>
  surface-signal-html contract
  surface-signal-html check-runtime-size

The CLI wraps the source-project compiler used by the skills. It has no agent-specific assumptions.
`);
}
