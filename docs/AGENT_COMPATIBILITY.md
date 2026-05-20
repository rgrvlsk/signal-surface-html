# Agent Compatibility

Surface Signal has three operating modes:

| Mode | When used | Output |
| --- | --- | --- |
| Full repo/plugin | `surface-kit` exists beside the skills. | Source-backed HTML project. |
| Package runtime | Skill is copied, but `npx` can run the package or GitHub repo. | Source-backed HTML project. |
| Standalone HTML | No compiler runtime is available. | Single self-contained HTML file. |

The skills are portable `SKILL.md` directories. The compiler/runtime is agent-agnostic.

## Install

```bash
npx skills add rgrvlsk/signal-surface-html --list
npx skills add rgrvlsk/signal-surface-html --skill surface-signal-html
npx skills add rgrvlsk/signal-surface-html --skill plan-studio
```

Native adapter install:

```bash
npx --yes surface-signal-html@latest install --target all --out .
```

Targets:

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
| `opencode` | `AGENTS.surface-signal-html.md` |

Use a comma-separated target list for focused installs:

```bash
npx --yes surface-signal-html@latest install --target claude,cursor,windsurf --out .
```

## Runtime Resolution

Every skill tries, in order:

1. `../../surface-kit/scripts/*.mjs`
2. `npx --yes surface-signal-html@latest <command>`
3. `npx --yes github:rgrvlsk/signal-surface-html <command>`
4. Standalone HTML fallback

`skills add --copy` copies the selected skill folder. It does not copy `surface-kit`, so copied skills need package/GitHub runtime or fallback HTML.

Standalone HTML is small: inline CSS/JS, local comments/decisions, `localStorage`, and follow-up prompt export. It is not source-backed.

## CLI

```bash
surface-signal-html contract
surface-signal-html create <spec.json> [--out /tmp/surface-signal-html]
surface-signal-html render <surface-project>
surface-signal-html import-feedback <surface-project> <feedback.txt|json>
surface-signal-html check-runtime-size
surface-signal-html install --target all --out .
```

## Requirements

- Full source-backed mode: Node.js 20+ and filesystem access.
- Standalone HTML mode: filesystem access if writing a file; otherwise the agent can return fenced HTML.
- Normal fixture rendering: no browser, no Codex-specific API.
- Cold icon cache: rendering may fetch pinned Lucide Static SVGs.

## Gemini

```bash
gemini extensions install https://github.com/rgrvlsk/signal-surface-html
```

The extension provides `GEMINI.md` plus `/surface-signal-html` and `/s2-html` commands.
