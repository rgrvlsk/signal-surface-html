---
name: qa-triage-wall
description: Use when test failures, QA reports, user-visible regressions, flaky failures, bug batches, or release blockers need interactive triage.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "qa-triage"
---

# QA Triage Wall

## Runtime Resolution

Before reading contracts or running scripts, choose compiler access:

1. If `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill, use the bundled full-plugin commands:
   - `node ../../surface-kit/scripts/create-surface-project.mjs <spec.json>`
   - `node ../../surface-kit/scripts/render-surface.mjs <project>`
   - `node ../../surface-kit/scripts/import-feedback.mjs <project> <feedback.txt|json>` when importing reviewer feedback.
   - Read `../../surface-kit/references/contracts.md` before creating a spec.
2. If the bundled scripts are missing, assume a standalone skills.sh or copied-skill installation. Use the agent-agnostic package CLI instead:
   - `npx --yes surface-signal-html@latest contract`
   - `npx --yes surface-signal-html@latest create <spec.json>`
   - `npx --yes surface-signal-html@latest render <project>`
   - `npx --yes surface-signal-html@latest import-feedback <project> <feedback.txt|json>` when importing reviewer feedback.
3. If the npm package is not available yet and the GitHub repo is reachable, use the GitHub package spec with the same subcommands: `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
4. If neither the bundled scripts nor package CLI are available, stop with this notice exactly:

## **Surface Signal HTML runtime unavailable.** Install the full plugin from https://github.com/rgrvlsk/signal-surface-html or install/run the `surface-signal-html` CLI, then retry this skill. This skill cannot generate source-backed HTML without the compiler runtime.

Do not fall back to hand-built HTML.

Create a triage artifact that turns failures into explicit fix, defer, reject, or investigate decisions.

## Workflow

1. Read the resolved Surface Signal contract.
2. Build a spec with `artifactType: "qa-triage-wall"`.
3. Group by repro status, user impact, owner, suspected subsystem, or release gate.
4. Include repro steps, observed behavior, expected behavior, impact, and likely verification command.
5. Enable decisions and comments; enable editing when repro details are incomplete.
6. Create and render through the resolved Surface Signal runtime commands.

## Content Rules

- Distinguish confirmed defects from suspected issues.
- Keep broad suite failures separate from focused verification gaps.
- Export should identify blockers, owners, and the minimum proof needed to close each item.
