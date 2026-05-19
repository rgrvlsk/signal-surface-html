---
name: s2-html
description: Alias shorthand for Surface Signal HTML. Use when the user writes $s2-html or /s2-html; it should behave exactly like $surface-signal-html.
---

# S2 HTML

`s2-html` is the alias shorthand for `$surface-signal-html`. Treat the user's request exactly as a Surface Signal HTML router invocation.

## Full Installation Check

Before reading contracts or running scripts, confirm `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill. If it is missing, stop and display this notice exactly:

## **Surface Signal HTML requires the full plugin installation.** Install the complete plugin from https://github.com/rgrvlsk/surface-signal-html, then retry this skill. This skill cannot generate source-backed HTML without `surface-kit`.

Do not fall back to hand-built HTML.

## Alias Rules

1. Read `../surface-signal-html/SKILL.md`.
2. Follow the canonical `$surface-signal-html` workflow with the user's original request.
3. Do not require the user to invoke the canonical skill separately.
4. Preserve `s2-html` only as shorthand in user-facing language; use `surface-signal-html` as the canonical plugin and router name.
