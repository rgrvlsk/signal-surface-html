---
name: research-atlas
description: Use when research, source-heavy analysis, technical stack evaluation, market review, citations, claims, or evidence synthesis need an interactive HTML review artifact.
---

# Research Atlas

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Signal Surface HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a source-backed synthesis surface with claims, citations, confidence, open questions, and decision-ready conclusions.

## Workflow

1. Browse or inspect primary sources when current facts matter.
2. Read `../../surface-kit/references/contracts.md`.
3. Build a spec with `artifactType: "research-atlas"`.
4. Group claims by decision, confidence, source quality, risk, or unresolved question.
5. Include source names and short references in `details`; keep the main item focused on the claim and implication.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Separate facts, inferences, and recommendations.
- Record uncertainty explicitly.
- Export should let a fresh agent continue research or act on the approved conclusion without prior chat context.
