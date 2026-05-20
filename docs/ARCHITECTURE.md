# Architecture

Surface Signal HTML is intentionally split into a small instruction layer and a harness-agnostic compiler layer.

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Skill instructions | `skills/*/SKILL.md` | Choose artifact type, create specs, and tell the agent when to use the runtime. |
| Adapter metadata | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/`, `.gemini/`, `commands/`, `adapters/` | Let different harnesses discover the same skills or equivalent prompt/rule surface. |
| CLI | `bin/surface-signal-html.mjs` | Stable command entrypoint for agents that only know how to run commands. |
| Compiler | `surface-kit/scripts/*` | Convert specs into editable source projects and render self-contained HTML. |
| Runtime | `surface-kit/runtime/*` | Browser UI for review, editing, decisions, comments, shortcuts, prompt export, and offline viewing. |
| Fixtures/tests | `fixtures/`, `tests/` | Verify every artifact type and distribution path. |

## Core Rule

`surface.json`, `src/**`, and `feedback/**` are authoritative. `dist/index.html` is disposable compiled output.

This rule keeps follow-up agent sessions deterministic. The agent edits structured source, rebuilds, and exports prompt/feedback context instead of reverse-engineering generated HTML.

## Adapter Rule

Committed adapter files should stay thin. They should point back to the same Agent Skills and CLI runtime instead of forking behavior per harness.

When a harness needs native files, run:

```bash
surface-signal-html install --target <target> --out <workspace>
```

The command materializes copies or rule/prompt wrappers for that workspace without making those generated copies source of truth.
