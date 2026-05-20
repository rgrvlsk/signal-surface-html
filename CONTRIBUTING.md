# Contributing

## Setup

```bash
npm install
```

## Required Checks

```bash
npm run publish:check
npm pack --dry-run
```

## Rules

- Edit source projects, fixtures, skills, or runtime code; do not patch generated `dist/index.html`.
- Keep skill instructions self-contained. No local-only paths or private tools.
- Update fixtures when artifact behavior changes.
- Keep adapter files thin; shared behavior belongs in skills, CLI, or `surface-kit`.
- Do not commit scratch files, temp projects, `node_modules/`, `.superpowers/`, or generated local installs.

## Pull Requests

Include:

- What changed.
- Why it matters to users.
- Affected skill, runtime path, or adapter.
- `npm run publish:check` result.
- Screenshot or rendered artifact notes for visual changes.
