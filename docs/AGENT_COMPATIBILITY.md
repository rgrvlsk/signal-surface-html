# Agent Compatibility

Surface Signal HTML is split into two layers:

- **Skills:** portable Agent Skills under `skills/*/SKILL.md`.
- **Compiler runtime:** the agent-agnostic `surface-signal-html` CLI and `surface-kit` source-project compiler.

The skills can be installed by any harness that understands the Agent Skills directory shape. The runtime does not depend on Codex, ChatGPT, or a specific agent harness.

## Native Adapter Install

Materialize native adapters into another workspace:

```bash
npx --yes surface-signal-html@latest install --target all --out /path/to/workspace
```

Available targets:

| Target | Output |
| --- | --- |
| `claude` | `.claude/skills/*/SKILL.md` |
| `openhands` | `.agents/skills/*/SKILL.md` |
| `cursor` | `.cursor/skills/*/SKILL.md` |
| `gemini` | `.gemini/skills/*/SKILL.md` |
| `windsurf` | `.windsurf/skills/*/SKILL.md` |
| `continue` | `.continue/prompts/surface-signal-html.md` |
| `cline` | `.clinerules/surface-signal-html.md` |
| `roo` | `.roo/rules/surface-signal-html.md` |
| `goose` | `goose/surface-signal-html.recipe.yaml` |
| `opencode` | `AGENTS.surface-signal-html.md` for manual merge into `AGENTS.md` |

Use comma-separated targets for focused installs:

```bash
npx --yes surface-signal-html@latest install --target claude,cursor,windsurf --out .
```

## Install With skills CLI

List available skills:

```bash
npx skills add rgrvlsk/signal-surface-html --list
```

Install the router skill:

```bash
npx skills add rgrvlsk/signal-surface-html --skill surface-signal-html
```

Install the shorthand alias:

```bash
npx skills add rgrvlsk/signal-surface-html --skill s2-html
```

Install a specific surface:

```bash
npx skills add rgrvlsk/signal-surface-html --skill plan-studio
```

## Runtime Resolution

Every skill resolves compiler access in this order:

1. Full repository/plugin install: run bundled `surface-kit/scripts/*.mjs`.
2. Standalone skill install: run `npx --yes surface-signal-html@latest <command>`.
3. Pre-publication or GitHub-only install: run `npx --yes github:rgrvlsk/signal-surface-html <command>`.
4. If no compiler runtime is available, stop rather than generating hand-built HTML.

This matters because `npx skills add ... --copy` copies only the selected skill folder into an agent target. It does not copy `surface-kit`.

## CLI Commands

```bash
surface-signal-html contract
surface-signal-html create <spec.json> [--out /tmp/surface-signal-html]
surface-signal-html render <surface-project>
surface-signal-html import-feedback <surface-project> <feedback.txt|json>
surface-signal-html check-runtime-size
surface-signal-html install --target all --out .
```

## Harness Notes

- Requires Node.js 20 or newer.
- Requires filesystem access to write temporary source projects.
- Does not require a browser, network access, or Codex-specific APIs for normal fixture rendering.
- Build-time icon resolution fetches pinned Lucide Static SVGs when rendering if the local cache is cold.
- Generated artifacts are self-contained HTML and can be opened offline.

## Gemini Extension

The repository also contains a Gemini CLI extension manifest:

```bash
gemini extensions install https://github.com/rgrvlsk/signal-surface-html
```

The extension provides `GEMINI.md` context and `/surface-signal-html` plus `/s2-html` commands.
