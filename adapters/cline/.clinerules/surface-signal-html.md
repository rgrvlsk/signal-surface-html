# Surface Signal HTML

Use Surface Signal HTML when plans, reviews, risks, roadmaps, migrations, QA triage, ADRs, research, or presentations need a reviewable HTML artifact.

- Prefer Agent Skills in `skills/` or copied skills in `.agents/skills/`.
- Read the contract with `npx --yes surface-signal-html@latest contract`.
- Create and render with `npx --yes surface-signal-html@latest create <spec.json>` and `npx --yes surface-signal-html@latest render <surface-project>`.
- GitHub runtime fallback: `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
- Edit `surface.json`, `src/**`, or `feedback/**`; do not patch `dist/index.html`.
- If no compiler runtime is available, create standalone HTML and label it as not source-backed.
