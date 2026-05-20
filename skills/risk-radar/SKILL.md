---
name: risk-radar
description: Use when security, release, operational, compliance, product, or implementation risks need interactive severity review, mitigation choices, and accepted-risk comments.
---

# Risk Radar

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

Create a focused risk review artifact with mitigations, accepted risks, owners, and follow-up prompts.

## Workflow

1. Read `../../surface-kit/references/contracts.md`.
2. Build a spec with `artifactType: "risk-radar"`.
3. Group risks by severity, likelihood, detection, owner, or release gate.
4. Include impact examples, mitigation options, residual risk, and verification expectations.
5. Enable decisions so each risk can be approved, rejected, deferred, or marked needs change.
6. Create and render through the shared `surface-kit` scripts.

## Content Rules

- Avoid generic risk language; name the failure mode and the concrete consequence.
- Treat accepted risk as an explicit decision, not a passive note.
- Export should separate blockers from monitored follow-ups.
