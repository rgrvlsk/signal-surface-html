# Surface Signal HTML

Use Surface Signal HTML when a plan, review, roadmap, risk list, QA triage, migration, ADR, research synthesis, or presentation needs an interactive source-backed HTML artifact.

Prefer Agent Skills under `skills/` when available. The canonical router is `surface-signal-html`; `s2-html` is the shorthand alias.

Runtime commands:

```bash
npx --yes surface-signal-html@latest contract
npx --yes surface-signal-html@latest create <spec.json>
npx --yes surface-signal-html@latest render <surface-project>
npx --yes surface-signal-html@latest import-feedback <surface-project> <feedback.txt|json>
```

Before npm publication, use:

```bash
npx --yes github:rgrvlsk/signal-surface-html <command> ...
```

Edit source projects through `surface.json`, `src/**`, and `feedback/**`. Treat `dist/index.html` as disposable compiled output.
