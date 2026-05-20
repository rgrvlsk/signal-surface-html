---
name: s2-html
description: Alias shorthand for Surface Signal HTML. Use when the user writes $s2-html or /s2-html; it should behave exactly like $surface-signal-html.
license: MIT
compatibility: Requires Node.js 20+ and filesystem access. Uses bundled surface-kit in full installs or the surface-signal-html package CLI in standalone installs.
metadata:
  surface-signal-html.role: "alias"
---

# S2 HTML

`s2-html` is the alias shorthand for `$surface-signal-html`. Treat the user's request exactly as a Surface Signal HTML router invocation.

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

## Alias Rules

1. If `../surface-signal-html/SKILL.md` exists, read it and follow the canonical `$surface-signal-html` workflow with the user's original request.
2. If the canonical skill file is unavailable because this alias was installed alone, route the task directly:
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
3. Do not require the user to invoke the canonical skill separately.
4. Preserve `s2-html` only as shorthand in user-facing language; use `surface-signal-html` as the canonical plugin and router name.
