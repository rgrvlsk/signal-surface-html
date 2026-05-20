---
name: Surface Signal HTML
description: Create a source-backed interactive HTML decision artifact for plans, reviews, risks, roadmaps, migrations, QA triage, ADRs, research, or presentations.
invokable: true
---

Use Surface Signal HTML for this task.

Read the contract with `npx --yes surface-signal-html@latest contract`, then create a JSON spec and render it with:

```bash
npx --yes surface-signal-html@latest create <spec.json>
npx --yes surface-signal-html@latest render <surface-project>
```

Before npm publication, use `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.

Route plans to `plan-studio`, findings to `verdict-rundown`, workflows to `feature-storyboard`, presentations to `keynote-canvas`, ADRs to `adr-navigator`, risks to `risk-radar`, roadmaps to `roadmap-council`, QA failures to `qa-triage-wall`, migrations to `migration-map`, and source-heavy research to `research-atlas`.

Edit `surface.json`, `src/**`, or `feedback/**`; never patch compiled `dist/index.html`.
