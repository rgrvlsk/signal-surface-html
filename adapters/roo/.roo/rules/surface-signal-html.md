# Surface Signal HTML

Use Surface Signal HTML for decision boards, plan reviews, risk reviews, roadmaps, migrations, QA triage, ADR comparisons, research synthesis, and HTML presentations.

- Prefer Agent Skills in `skills/` or copied skills in `.agents/skills/`.
- Read the contract with `npx --yes surface-signal-html@latest contract`.
- Create with `npx --yes surface-signal-html@latest create <spec.json>`.
- Render with `npx --yes surface-signal-html@latest render <surface-project>`.
- GitHub runtime fallback: `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
- Source project files are authoritative. Never patch compiled `dist/index.html`.
- If no compiler runtime is available, create standalone HTML and label it as not source-backed.
