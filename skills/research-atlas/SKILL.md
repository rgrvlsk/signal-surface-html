---
name: research-atlas
description: Use when research, source-heavy analysis, technical stack evaluation, market review, citations, claims, or evidence synthesis need an interactive HTML review artifact.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "research-synthesis"
---

# Research Atlas

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

Create a source-backed synthesis surface with claims, citations, confidence, open questions, and decision-ready conclusions.

## Workflow

1. Browse or inspect primary sources when current facts matter.
2. Read the resolved Surface Signal contract.
3. Build a spec with `artifactType: "research-atlas"`.
4. Group claims by decision, confidence, source quality, risk, or unresolved question.
5. Include source names and short references in `details`; keep the main item focused on the claim and implication.
6. Create and render through the resolved Surface Signal runtime commands.

## Content Rules

- Separate facts, inferences, and recommendations.
- Record uncertainty explicitly.
- Export should let a fresh agent continue research or act on the approved conclusion without prior chat context.
