---
name: Surface Signal HTML
description: Create a reviewable HTML decision artifact for plans, reviews, risks, roadmaps, migrations, QA triage, ADRs, research, or presentations.
invokable: true
---

Use Surface Signal HTML for this task.

Read the contract with `npx --yes surface-signal-html@latest contract`, then create a JSON spec and render it with:

```bash
npx --yes surface-signal-html@latest create <spec.json>
npx --yes surface-signal-html@latest render <surface-project>
```

GitHub runtime fallback: `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.

Route plans to `plan-studio`, findings to `verdict-rundown`, workflows to `feature-storyboard`, presentations to `keynote-canvas`, ADRs to `adr-navigator`, risks to `risk-radar`, roadmaps to `roadmap-council`, QA failures to `qa-triage-wall`, migrations to `migration-map`, and source-heavy research to `research-atlas`.

Edit `surface.json`, `src/**`, or `feedback/**`; never patch compiled `dist/index.html`.

If no compiler runtime is available, create standalone HTML and label it as not source-backed.
