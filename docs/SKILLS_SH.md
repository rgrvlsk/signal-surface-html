# skills.sh Readiness

Surface Signal HTML is structured to be installable from the public GitHub repo:

```bash
npx skills add rgrvlsk/signal-surface-html
```

There is no separate skills.sh publish command. A repo can appear on skills.sh after people install it through the `skills` CLI.

## Compatibility Gates

Run these before pushing skill changes:

```bash
DISABLE_TELEMETRY=1 npx --yes skills@latest add . --list
DISABLE_TELEMETRY=1 npx --yes skills@latest add . --skill surface-signal-html --agent universal --copy -y
for d in skills/*; do DISABLE_TELEMETRY=1 npx --yes skills-ref validate "$d"; done
node bin/surface-signal-html.mjs install --target all --out "$(mktemp -d)"
npm run publish:check
npm pack --dry-run
```

Expected results:

- `skills add . --list` finds all 12 skills.
- Copy-mode install includes a standalone runtime fallback in the installed `SKILL.md`.
- `skills-ref` validates every `SKILL.md` against the Agent Skills specification.
- The adapter command materializes native skill/rule/prompt files for other code agents.
- `npm run publish:check` passes tests, fixture rendering, and runtime size checks.
- `npm pack --dry-run` includes `bin/`, `skills/`, `surface-kit/`, docs, fixtures, and package metadata.

## Public Repo Checklist

- `skills/*/SKILL.md` has valid Agent Skills frontmatter.
- Root README explains what the skill collection does and how to install it.
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, issue templates, and CI exist.
- Script/runtime behavior is auditable from source.
- Skills do not silently hand-build HTML if the compiler runtime is unavailable.
