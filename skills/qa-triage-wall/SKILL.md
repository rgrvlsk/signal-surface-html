---
name: qa-triage-wall
description: Use when test failures, QA reports, user-visible regressions, flaky failures, bug batches, or release blockers need interactive triage.
---

# QA Triage Wall

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a triage artifact that turns failures into explicit fix, defer, reject, or investigate decisions.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "qa-triage-wall"`.
3. Group by repro status, user impact, owner, suspected subsystem, or release gate.
4. Include repro steps, observed behavior, expected behavior, impact, and likely verification command.
5. Enable decisions and comments; enable editing when repro details are incomplete.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Distinguish confirmed defects from suspected issues.
- Keep broad suite failures separate from focused verification gaps.
- Export should identify blockers, owners, and the minimum proof needed to close each item.
