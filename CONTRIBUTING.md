# Contributing

Thanks for considering a contribution to Signal Surface HTML. This project is a Codex plugin, so changes should keep the skills, fixture specs, and shared `surface-kit` runtime in sync.

## Development Setup

```bash
npm install
```

## Required Checks

Run the full publish check before opening a pull request:

```bash
npm run publish:check
```

For package contents:

```bash
npm pack --dry-run
```

## Contribution Guidelines

- Keep generated `dist/index.html` output disposable; source projects and fixtures are authoritative.
- Keep skill instructions self-contained and avoid references to local-only tools or absolute paths.
- Add or update fixtures when changing artifact behavior.
- Prefer small, focused changes that preserve the shared runtime contract.
- Do not commit local scratch files, generated temporary projects, `node_modules/`, or `.superpowers/`.

## Pull Requests

Include:

- What changed and why.
- Which skill or runtime behavior is affected.
- Verification output from `npm run publish:check`.
- Screenshots or rendered artifact notes for user-visible changes.
