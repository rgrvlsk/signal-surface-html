---
name: s2-html
description: Meta-skill for Signal Surface HTML. Use when the user writes /s2-html, asks which Signal Surface skill to use, asks for an interactive HTML artifact without naming a specific skill, or wants the best artifact type chosen for a plan, review, explainer, presentation, risk, roadmap, migration, QA, ADR, or research task.
---

# S2 HTML

Analyze the task, choose the best Signal Surface HTML skill, then create a temporary source-backed HTML artifact. The user should not need to guess the right specialized skill.

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Signal Surface HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/signal-surface-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

## Routing

Rank the candidates by the user's next decision, audience, and artifact shape:

- Plan or RC plan: choose `plan-studio`.
- Review findings, regressions, Q&A, or backlog lists: choose `verdict-rundown`.
- Feature/workflow explanation: choose `feature-storyboard`.
- Presentation/keynote/readout: choose `keynote-canvas`.
- Architecture decision: choose `adr-navigator`.
- Security, release, or operational risk: choose `risk-radar`.
- Roadmap or prioritization: choose `roadmap-council`.
- Test failures or QA reports: choose `qa-triage-wall`.
- Rollout, migration, or rollback planning: choose `migration-map`.
- Source-heavy synthesis: choose `research-atlas`.

## Rules

1. Read `../../surface-kit/references/contracts.md`.
2. State the chosen skill and one short reason. If confidence is low, ask one clarifying question instead of making a weak artifact.
3. Use the chosen skill's workflow. Do not require the user to invoke that skill separately.
4. Generate a JSON spec and run the shared `surface-kit` scripts.
5. Keep `dist/index.html` disposable; iteration edits `src/`, `surface.json`, or `feedback/`.
6. If the user literally types `/s2-html`, treat it as this meta-skill invocation.
