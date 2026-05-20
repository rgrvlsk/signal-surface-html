---
name: surface-signal-html
description: Canonical meta-skill for Surface Signal HTML. Use when the user writes /surface-signal-html, asks which Surface Signal skill to use, asks for an interactive HTML artifact without naming a specific skill, or wants the best artifact type chosen for a plan, review, explainer, presentation, risk, roadmap, migration, QA, ADR, or research task. The shorthand alias is s2-html.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "router"
---

# Surface Signal HTML

Analyze the task, choose the best Surface Signal HTML skill, then create a temporary source-backed HTML artifact. The user should not need to guess the right specialized skill.

## Runtime Resolution

Before reading contracts or running scripts, choose compiler access:

1. If `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill, use the bundled full-plugin commands:
   - `node ../../surface-kit/scripts/create-surface-project.mjs <spec.json>`
   - `node ../../surface-kit/scripts/render-surface.mjs <project>`
   - `node ../../surface-kit/scripts/import-feedback.mjs <project> <feedback.txt|json>` when importing reviewer feedback.
   - Read `../../surface-kit/references/contracts.md` before creating a spec.
2. If the bundled scripts are missing, assume a standalone skills.sh or copied-skill installation. Use the agent-agnostic package CLI instead:
   - `npx --yes surface-signal-html@latest contract`
   - `npx --yes surface-signal-html@latest create <spec.json>`
   - `npx --yes surface-signal-html@latest render <project>`
   - `npx --yes surface-signal-html@latest import-feedback <project> <feedback.txt|json>` when importing reviewer feedback.
3. If the npm package is not available yet and the GitHub repo is reachable, use the GitHub package spec with the same subcommands: `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
4. If neither the bundled scripts nor package CLI are available, stop with this notice exactly:

## **Surface Signal HTML runtime unavailable.** Install the full plugin from https://github.com/rgrvlsk/signal-surface-html or install/run the `surface-signal-html` CLI, then retry this skill. This skill cannot generate source-backed HTML without the compiler runtime.

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

1. Read the resolved Surface Signal contract.
2. State the chosen skill and one short reason. If confidence is low, ask one clarifying question instead of making a weak artifact.
3. Use the chosen skill's workflow. Do not require the user to invoke that skill separately.
4. Generate a JSON spec and run the resolved Surface Signal runtime commands.
5. Keep `dist/index.html` disposable; iteration edits `src/`, `surface.json`, or `feedback/`.
6. If the user literally types `/surface-signal-html`, treat it as this meta-skill invocation.
7. If the user invokes `$s2-html` or types `/s2-html`, treat it as the shorthand alias for this same meta-skill.
