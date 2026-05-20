---
name: plan-studio
description: Use when a plan, implementation plan, RC plan, planning-mode proposal, architecture plan, or multi-step task needs an editable interactive HTML review artifact before final approval.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "plan-review"
---

# Plan Studio

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

Create an editable source-backed HTML plan review surface. Use it when Markdown plan review would hide too many decisions, comments, or scope edits.

## Workflow

1. Read the resolved Surface Signal contract.
2. Draft a JSON spec with `artifactType: "plan-studio"` and fresh-session context.
3. Include sections for summary, implementation changes, public interfaces, tests, assumptions, risks, and open questions when relevant.
4. Set capabilities to allow text editing, add/remove items, reorder items, comments, and decisions.
5. Create the source project, then render it with the resolved Surface Signal runtime commands.
6. Present `dist/index.html` for review, but instruct future iteration to edit `src/`, `surface.json`, or `feedback/` and rebuild.

## Content Rules

- Treat this as an RC plan, not final approval.
- Keep copy spare; spend detail on concrete implementation decisions.
- Represent every unresolved tradeoff as an item with `pending` status.
- If used while the agent is in Plan Mode, return the HTML artifact for iteration before producing the final `<proposed_plan>`.
