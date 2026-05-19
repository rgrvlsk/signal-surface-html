---
name: migration-map
description: Use when migrations, rollouts, compatibility plans, deprecations, data moves, API transitions, or rollback strategies need an interactive HTML planner.
---

# Migration Map

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/surface-signal-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a migration planning surface with phases, gates, blast radius, compatibility, and rollback choices.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "migration-map"`.
3. Organize phases by preparation, shadowing, cutover, validation, cleanup, and rollback.
4. Include data contracts, compatibility constraints, monitoring, ownership, and acceptance gates.
5. Enable editing, reorder, comments, and decisions.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Make rollback concrete enough to execute.
- Surface compatibility decisions before implementation details.
- Export should state the approved sequence and the gates that stop progression.
