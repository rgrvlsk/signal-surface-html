# Surface Signal HTML

Use Surface Signal HTML when plans, reviews, risks, roadmaps, migrations, QA triage, ADRs, research, or presentations need an interactive HTML artifact.

- Prefer Agent Skills in `skills/` or copied skills in `.agents/skills/` when available.
- Read the contract with `npx --yes surface-signal-html@latest contract`.
- Create and render with `npx --yes surface-signal-html@latest create <spec.json>` and `npx --yes surface-signal-html@latest render <surface-project>`.
- Before npm publication, use `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
- Edit `surface.json`, `src/**`, or `feedback/**`; do not patch `dist/index.html`.
