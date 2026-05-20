---
name: feature-storyboard
description: Use when a feature, workflow, product behavior, integration, or system story needs a graphical HTML explainer with comment-only feedback.
---

# Feature Storyboard

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a visual, commentable feature explainer. The user can add clarification or requested changes, but should not directly edit source text in the artifact.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "feature-storyboard"`.
3. Structure the feature as story, actors, workflow, states, edge cases, dependencies, and consequences.
4. Set `editText`, `addRemoveItems`, `reorderItems`, and `decisions` to false; keep `comments` true.
5. Prefer inline SVG workflow primitives or build-time rendered diagrams; do not ship Mermaid runtime.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Explain how the feature behaves, not how to use the page.
- Use comments for further clarification or requested implementation changes.
- The exported prompt should either request an updated HTML explainer or ask the agent to act on the requested improvements.
