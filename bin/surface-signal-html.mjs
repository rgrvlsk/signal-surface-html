#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const commands = {
  create: "surface-kit/scripts/create-surface-project.mjs",
  render: "surface-kit/scripts/render-surface.mjs",
  "import-feedback": "surface-kit/scripts/import-feedback.mjs",
  "check-runtime-size": "surface-kit/scripts/check-runtime-size.mjs"
};
const adapterTargets = {
  claude: { type: "skills-copy", dest: ".claude/skills" },
  openhands: { type: "skills-copy", dest: ".agents/skills" },
  cursor: { type: "skills-copy", dest: ".cursor/skills" },
  gemini: { type: "skills-copy", dest: ".gemini/skills" },
  windsurf: { type: "skills-copy", dest: ".windsurf/skills" },
  continue: { type: "template", src: "adapters/continue", dest: ".continue" },
  cline: { type: "template", src: "adapters/cline", dest: "." },
  roo: { type: "template", src: "adapters/roo", dest: "." },
  goose: { type: "template", src: "adapters/goose", dest: "goose" },
  opencode: { type: "opencode" }
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

if (command === "list-adapters") {
  process.stdout.write(`${Object.keys(adapterTargets).join("\n")}\n`);
  process.exit(0);
}

if (command === "adapters") {
  await installAdapters(args);
  process.exit(0);
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
  surface-signal-html list-adapters
  surface-signal-html adapters [--target all|claude|openhands|cursor|gemini|windsurf|continue|cline|roo|goose|opencode] [--out .]

The CLI wraps the source-project compiler used by the skills. It has no agent-specific assumptions.
`);
}

async function installAdapters(rawArgs) {
  const parsed = parseFlags(rawArgs);
  const target = parsed.target || "all";
  const outRoot = resolve(parsed.out || process.cwd());
  const targets = target === "all" ? Object.keys(adapterTargets) : target.split(",");
  const installed = [];

  for (const name of targets) {
    const adapter = adapterTargets[name];
    if (!adapter) {
      throw new Error(`Unknown adapter target: ${name}`);
    }

    if (adapter.type === "skills-copy") {
      const dest = join(outRoot, adapter.dest);
      await mkdir(dest, { recursive: true });
      for (const skillName of await readdir(join(root, "skills"))) {
        await cp(join(root, "skills", skillName), join(dest, skillName), {
          recursive: true,
          force: true
        });
      }
      installed.push({ target: name, path: dest });
      continue;
    }

    if (adapter.type === "template") {
      const dest = join(outRoot, adapter.dest);
      await mkdir(dest, { recursive: true });
      await cp(join(root, adapter.src), dest, {
        recursive: true,
        force: true
      });
      installed.push({ target: name, path: dest });
      continue;
    }

    if (adapter.type === "opencode") {
      const dest = join(outRoot, "AGENTS.surface-signal-html.md");
      await writeFile(dest, opencodeInstructions(), "utf8");
      installed.push({ target: name, path: dest });
    }
  }

  process.stdout.write(`${JSON.stringify({ installed }, null, 2)}\n`);
}

function parseFlags(rawArgs) {
  const flags = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const value = rawArgs[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = rawArgs[index + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

function opencodeInstructions() {
  return `# Surface Signal HTML

Use Surface Signal HTML when plans, reviews, risk lists, roadmaps, migrations, QA triage, ADRs, research, or presentations need an interactive source-backed HTML artifact instead of flat Markdown.

Runtime:

- Prefer repository skills under \`skills/\` when available.
- Create specs from the contract: \`npx --yes surface-signal-html@latest contract\`.
- Render with \`npx --yes surface-signal-html@latest create <spec.json>\` then \`npx --yes surface-signal-html@latest render <project>\`.
- Edit \`src/\`, \`surface.json\`, or \`feedback/\`; never patch compiled \`dist/index.html\`.
`;
}
