---
name: verdict-rundown
description: Use when review findings, regressions, Q&A items, backlog candidates, audit issues, or long decision lists need an interactive approve/reject/defer HTML rundown.
---

# Verdict Rundown

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a management-ready HTML board for multiple items that need explicit decisions and comments.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "verdict-rundown"`.
3. Group items by severity, owner, business area, release impact, or decision category.
4. Give each item a concrete real-world impact, folded technical details, references, and `pending` status.
5. Enable text edits, add/remove, reorder, comments, and decisions.
6. Create and render the source project with the shared `surface-kit` scripts.

## Content Rules

- Use direct labels: approve, reject, defer, needs change.
- Keep code and references folded in `details`; keep the main board readable for non-technical reviewers.
- Export prompt output must say exactly which items are approved, blocked, deferred, or need clarification.
