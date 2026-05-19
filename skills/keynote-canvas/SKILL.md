---
name: keynote-canvas
description: Use when creating a projected HTML keynote, presentation, leadership readout, product narrative, workshop talk, or slide-like artifact.
---

# Keynote Canvas

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Signal Surface HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create projected HTML presentations from a temporary source project. Always negotiate the outline before rendering unless the user already provided a complete outline.

## Workflow

1. First propose a short outline: audience, goal, sections, required metrics, images/screenshots, and source plan.
2. After the outline is stable, read `../../surface-kit/references/contracts.md`.
3. Build a spec with `artifactType: "keynote-canvas"`.
4. Use large, readable sections, concise speaker-facing copy, prominent visuals, and source notes.
5. Generate or source images/screenshots only when requested or when they materially improve understanding.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Optimize for projection: fewer words, stronger hierarchy, clean spacing.
- Keep the compiled HTML self-contained.
- Use native SVG charts and diagrams by default; use build-time helpers for complex visuals.
