# Surface Signal HTML

[![CI](https://github.com/rgrvlsk/signal-surface-html/actions/workflows/ci.yml/badge.svg)](https://github.com/rgrvlsk/signal-surface-html/actions/workflows/ci.yml)
[![skills.sh](https://skills.sh/b/rgrvlsk/signal-surface-html)](https://skills.sh/rgrvlsk/signal-surface-html)

Surface Signal HTML is an agent plugin for turning plans, reviews, risk lists, research, and roadmap decisions into interactive, self-contained HTML artifacts.

It is built for work that is too nuanced for a plain Markdown checklist. Each artifact is compiled from an editable source project, so follow-up sessions edit structured source files and rebuild instead of patching disposable HTML output.

![Surface Signal HTML preview](docs/assets/surface-signal-preview.gif)

## What You Get

- A canonical router skill, `$surface-signal-html`, with `$s2-html` as the shorthand alias.
- Ten specialized skills for plans, reviews, feature explainers, presentations, ADRs, risks, roadmaps, QA triage, migrations, and research.
- A shared `surface-kit` compiler and runtime for consistent offline HTML output.
- Native plugin metadata and adapter generation for Claude Code, Codex, Cursor, Gemini CLI, Windsurf, Continue, Cline, Roo Code, Goose, OpenHands, and opencode.
- Reviewer controls for comments, approvals, rejections, deferrals, item edits, and reordering when the artifact type supports them.
- Prompt and feedback export designed to let a fresh agent session continue from the reviewed artifact.

## At A Glance

| Need | Use |
| --- | --- |
| Agent Skills / skills.sh | `npx skills add rgrvlsk/signal-surface-html --skill surface-signal-html` |
| All native adapters | `npx --yes surface-signal-html@latest install --target all --out .` |
| CLI runtime only | `npx --yes surface-signal-html@latest contract` |
| Pre-publish GitHub fallback | `npx --yes github:rgrvlsk/signal-surface-html <command> ...` |

## Quick Start

Ask Surface Signal HTML to choose the right surface:

```text
$surface-signal-html turn this release review into an approval board
```

For shorter prompts, use the alias:

```text
$s2-html turn this release review into an approval board
```

You can also invoke a specialized skill directly:

```text
$plan-studio turn this implementation plan into an editable RC review
$verdict-rundown create an approval board for these regressions
$research-atlas synthesize these sources into an evidence review
```

The skill creates a temporary source project, renders `dist/index.html`, and points future iterations at the source files rather than the compiled HTML.

## Installation

List the available skills with the open `skills` CLI:

```bash
npx skills add rgrvlsk/signal-surface-html --list
```

Install the canonical router:

```bash
npx skills add rgrvlsk/signal-surface-html --skill surface-signal-html
```

Install the shorthand alias:

```bash
npx skills add rgrvlsk/signal-surface-html --skill s2-html
```

Install a specialized skill directly:

```bash
npx skills add rgrvlsk/signal-surface-html --skill plan-studio
```

Full plugin installs use the bundled `surface-kit` scripts. Standalone or copied skill installs use the package CLI fallback:

```bash
npx --yes surface-signal-html@latest create <spec.json>
npx --yes surface-signal-html@latest render <surface-project>
```

Before the npm package is published, the same CLI can be run from GitHub:

```bash
npx --yes github:rgrvlsk/signal-surface-html <command> ...
```

If no compiler runtime is available, the skills stop instead of hand-building HTML.

## Skill Catalog

| Skill | Best for |
| --- | --- |
| `surface-signal-html` | Canonical router for choosing the right Surface Signal skill. |
| `s2-html` | Shorthand alias for `surface-signal-html`. |
| `plan-studio` | Editable RC plans, planning proposals, implementation plans, and scope review. |
| `verdict-rundown` | Review findings, regressions, Q&A items, backlog candidates, and approve/reject/defer lists. |
| `feature-storyboard` | Graphical feature or workflow explainers with comment-only feedback. |
| `keynote-canvas` | Projected HTML presentations, leadership readouts, keynotes, and workshop narratives. |
| `adr-navigator` | Architecture decisions, ADRs, platform choices, and system tradeoffs. |
| `risk-radar` | Security, release, operational, compliance, and implementation risk reviews. |
| `roadmap-council` | Roadmap prioritization, backlog ranking, scope cuts, and stakeholder comments. |
| `qa-triage-wall` | Test failures, QA reports, flaky failures, bug batches, and release blockers. |
| `migration-map` | Rollouts, migrations, compatibility plans, deprecations, data moves, and rollback planning. |
| `research-atlas` | Source-backed research, stack evaluation, citations, claims, confidence, and open questions. |

## Artifact Model

Generated artifacts use this source-backed layout:

```text
/tmp/surface-signal-html/<artifact-id>/
  surface.json
  src/
    document.json
    content/*.md
    data/*.json
    assets/*
    app.jsx
    theme.css
  feedback/
    imported-feedback.json
  dist/
    index.html
```

Edit:

- `surface.json`
- `src/**`
- `feedback/**`

Treat `dist/index.html` as compiled output. If only compiled HTML is available, use its exported prompt or feedback payload to regenerate a source project instead of reverse-engineering the file.

## Runtime

Generated artifacts are offline and self-contained:

- Dark-first theme with automatic system-mode detection.
- Auto, dark, and light theme controls.
- Context-aware keyboard shortcuts with a compact legend.
- Active-card quick keys for decisions and reordering.
- No shortcut handling while form controls or editable regions are focused.
- Hidden prompt drawer with Clipboard API copy and manual-copy fallback.
- Build-time inlined Lucide Static icons; no runtime icon CDN requests.

Default shortcuts:

| Shortcut | Action |
| --- | --- |
| `P` | Open prompt drawer. |
| `C` | Copy generated prompt. |
| `?` | Open shortcut legend. |
| `Esc` | Close open panels when focus is outside form controls. |
| `1-9` | Select section. |
| `N` | Add an item to the active section when enabled. |
| `J` / `K` | Move active card selection down or up. |
| `A` / `R` / `D` / `E` | Approve, reject, defer, or mark the active card as needing change. |
| `Shift+J` / `Shift+K` | Move the active card down or up when reordering is enabled. |

## Development

Install dependencies:

```bash
npm install
```

Run the full publish check:

```bash
npm run publish:check
```

Individual checks:

```bash
npm test
npm run render:fixtures
npm run size:check
npm pack --dry-run
```

## Agent Compatibility

Surface Signal HTML follows the Agent Skills `SKILL.md` directory format and is designed for multiple code agents and harnesses. It includes adapters for Claude Code, OpenHands, Cursor, Gemini CLI, Windsurf, Continue, Cline, Roo Code, Goose, and opencode.

```bash
npx --yes surface-signal-html@latest install --target all --out /path/to/workspace
```

See [Agent Compatibility](docs/AGENT_COMPATIBILITY.md) and [skills.sh Readiness](docs/SKILLS_SH.md).

## Repository Layout

```text
.codex-plugin/plugin.json
.claude-plugin/plugin.json
.cursor-plugin/plugin.json
.gemini/commands/
adapters/
assets/
fixtures/
skills/
surface-kit/
  references/
  runtime/
  scripts/
tests/
```

## Design Principles

- Source projects are authoritative; compiled HTML is output.
- Artifacts should be minimal, professional, and decision-centered.
- Copy should serve the reviewer, not narrate agent process.
- Review controls should be obvious but not noisy.
- Prompt export must be useful in a fresh session with no prior chat context.

## License

MIT
