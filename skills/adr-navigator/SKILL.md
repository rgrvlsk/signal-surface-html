---
name: adr-navigator
description: Use when an architecture decision, ADR, technical tradeoff, migration strategy, platform choice, or system design option needs interactive comparison.
---

# ADR Navigator

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/surface-signal-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create an architecture decision surface that can export an ADR-ready prompt.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "adr-navigator"`.
3. Include options, constraints, consequences, migration cost, compatibility, rollback, and test strategy.
4. Mark the recommended option as `pending` unless the user already approved it.
5. Enable comments and decisions; enable text editing when the user should refine assumptions.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Compare realistic options only.
- Include the conservative default and the reason it may still be wrong.
- Export should contain enough context to draft or update an ADR in a fresh session.
