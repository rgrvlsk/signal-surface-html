---
name: roadmap-council
description: Use when roadmap items, backlog candidates, scope cuts, feature batches, or quarterly priorities need interactive prioritization and stakeholder comments.
---

# Roadmap Council

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/surface-signal-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a roadmap prioritization surface for ranking, deferring, and documenting scope decisions.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "roadmap-council"`.
3. Group items by outcome, dependency, user segment, risk, or release window.
4. Include impact, dependency, cost, and why-now/why-not context for each item.
5. Enable editing, add/remove, reorder, comments, and decisions.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Make deferrals as explicit as approvals.
- Capture dependency comments close to the item they affect.
- Export should produce a clear next roadmap instruction, not a vague preference summary.
