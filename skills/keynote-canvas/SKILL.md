---
name: keynote-canvas
description: Use when creating a projected HTML keynote, presentation, leadership readout, product narrative, workshop talk, or slide-like artifact.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "presentation"
---

# Keynote Canvas

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

Create projected HTML presentations from a temporary source project. Always negotiate the outline before rendering unless the user already provided a complete outline.

## Workflow

1. First propose a short outline: audience, goal, sections, required metrics, images/screenshots, and source plan.
2. After the outline is stable, read the resolved Surface Signal contract.
3. Build a spec with `artifactType: "keynote-canvas"`.
4. Use large, readable sections, concise speaker-facing copy, prominent visuals, and source notes.
5. Generate or source images/screenshots only when requested or when they materially improve understanding.
6. Create and render through the resolved Surface Signal runtime commands.

## Content Rules

- Optimize for projection: fewer words, stronger hierarchy, clean spacing.
- Keep the compiled HTML self-contained.
- Use native SVG charts and diagrams by default; use build-time helpers for complex visuals.
