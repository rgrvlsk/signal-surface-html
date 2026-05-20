# Surface Signal HTML

Use Surface Signal HTML when a plan, review, roadmap, risk list, QA triage, migration, ADR, research synthesis, or presentation needs a reviewable HTML artifact.

Prefer Agent Skills under `skills/`. Router: `surface-signal-html`. Alias: `s2-html`.

Runtime commands:

```bash
npx --yes surface-signal-html@latest contract
npx --yes surface-signal-html@latest create <spec.json>
npx --yes surface-signal-html@latest render <surface-project>
npx --yes surface-signal-html@latest import-feedback <surface-project> <feedback.txt|json>
```

GitHub runtime fallback:

```bash
npx --yes github:rgrvlsk/signal-surface-html <command> ...
```

Edit `surface.json`, `src/**`, or `feedback/**`. Do not patch `dist/index.html`.

If no compiler runtime is available, create standalone HTML and label it as not source-backed.
