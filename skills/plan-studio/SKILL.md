---
name: plan-studio
description: Use when a plan, implementation plan, RC plan, planning-mode proposal, architecture plan, or multi-step task needs an editable interactive HTML review artifact before final approval.
---

# Plan Studio

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/surface-signal-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create an editable source-backed HTML plan review surface. Use it when Markdown plan review would hide too many decisions, comments, or scope edits.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Draft a JSON spec with `artifactType: "plan-studio"` and fresh-session context.
3. Include sections for summary, implementation changes, public interfaces, tests, assumptions, risks, and open questions when relevant.
4. Set capabilities to allow text editing, add/remove items, reorder items, comments, and decisions.
5. Run `node ../../surface-kit/scripts/create-surface-project.mjs <spec.json>`, then `node ../../surface-kit/scripts/render-surface.mjs <project>`.
6. Present `dist/index.html` for review, but instruct future iteration to edit `src/`, `surface.json`, or `feedback/` and rebuild.

## Content Rules

- Treat this as an RC plan, not final approval.
- Keep copy spare; spend detail on concrete implementation decisions.
- Represent every unresolved tradeoff as an item with `pending` status.
- If used while the agent is in Plan Mode, return the HTML artifact for iteration before producing the final `<proposed_plan>`.
