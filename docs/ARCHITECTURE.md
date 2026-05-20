# Architecture

Surface Signal separates instructions from rendering.

## Layers

| Layer | Files | Job |
| --- | --- | --- |
| Skills | `skills/*/SKILL.md` | Choose the surface and tell the agent how to produce it. |
| CLI | `bin/surface-signal-html.mjs` | Stable command entrypoint for any agent. |
| Compiler | `surface-kit/scripts/*` | Turn a JSON spec into a source project and compiled HTML. |
| Runtime | `surface-kit/runtime/*` | Browser UI: comments, decisions, edits, shortcuts, prompt export. |
| Adapters | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/`, `.gemini/`, `adapters/` | Native discovery for different harnesses. |
| Tests | `fixtures/`, `tests/` | Prove fixtures render and distribution paths stay valid. |

## Source Rule

`surface.json`, `src/**`, and `feedback/**` are source of truth.

`dist/index.html` is compiled output. Do not patch it during normal iteration.

This keeps follow-up sessions deterministic: edit structured source, rebuild, export review context.

## Adapter Rule

Committed adapter files stay thin. They point back to the same skills and CLI instead of forking behavior per harness.

Generate workspace-specific adapters with:

```bash
surface-signal-html install --target <target> --out <workspace>
```
