# Surface Signal HTML

Use Surface Signal HTML when a user asks for an interactive artifact, decision board, plan review, risk review, roadmap, migration planner, QA triage wall, ADR comparison, research synthesis, or HTML presentation.

- Prefer Agent Skills in `skills/` or copied skills in `.agents/skills/`.
- Read the contract with `npx --yes surface-signal-html@latest contract`.
- Create with `npx --yes surface-signal-html@latest create <spec.json>`.
- Render with `npx --yes surface-signal-html@latest render <surface-project>`.
- Before npm publication, use `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
- Source project files are authoritative. Never patch compiled `dist/index.html`.
