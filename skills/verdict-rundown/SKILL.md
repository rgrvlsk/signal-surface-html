---
name: verdict-rundown
description: Use when review findings, regressions, Q&A items, backlog candidates, audit issues, or long decision lists need an interactive approve/reject/defer HTML rundown.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "decision-review"
---

# Verdict Rundown

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

Create a management-ready HTML board for multiple items that need explicit decisions and comments.

## Workflow

1. Read the resolved Surface Signal contract.
2. Build a spec with `artifactType: "verdict-rundown"`.
3. Group items by severity, owner, business area, release impact, or decision category.
4. Give each item a concrete real-world impact, folded technical details, references, and `pending` status.
5. Enable text edits, add/remove, reorder, comments, and decisions.
6. Create and render the source project with the resolved Surface Signal runtime commands.

## Content Rules

- Use direct labels: approve, reject, defer, needs change.
- Keep code and references folded in `details`; keep the main board readable for non-technical reviewers.
- Export prompt output must say exactly which items are approved, blocked, deferred, or need clarification.
