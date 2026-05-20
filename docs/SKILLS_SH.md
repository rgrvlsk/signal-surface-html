# skills.sh Readiness

Install from GitHub:

```bash
npx skills add rgrvlsk/signal-surface-html
```

There is no separate publish step for skills.sh. A public repo becomes usable through the `skills` CLI.

## Checks

Run before pushing skill or packaging changes:

```bash
DISABLE_TELEMETRY=1 npx --yes skills@latest add . --list
tmp_home="$(mktemp -d)" && HOME="$tmp_home" DISABLE_TELEMETRY=1 npx --yes skills@latest add "$PWD" --skill surface-signal-html --agent universal --copy -g -y && rm -rf "$tmp_home"
for d in skills/*; do DISABLE_TELEMETRY=1 npx --yes skills-ref validate "$d"; done
node bin/surface-signal-html.mjs install --target all --out "$(mktemp -d)"
npm run publish:check
npm pack --dry-run
```

Expected:

- `skills add --list` finds all 12 skills.
- Copied skills include runtime resolution and standalone HTML fallback.
- `skills-ref` validates every `SKILL.md`.
- Adapter install writes native skill/rule/prompt files.
- `publish:check` passes tests, fixture rendering, and runtime size check.
- Package dry run includes `bin/`, `skills/`, `surface-kit/`, docs, fixtures, and metadata.

## Public Repo Bar

- Valid Agent Skills frontmatter in every `skills/*/SKILL.md`.
- README explains the job, install path, and runtime modes.
- License, security policy, contributing guide, issue templates, and CI exist.
- Scripts and runtime behavior are auditable from source.
- Standalone fallback is clearly labeled and never claims to be source-backed.
