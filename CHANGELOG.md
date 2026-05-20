# Changelog

All notable changes to Surface Signal HTML are documented here.

## Unreleased

- Added a harness-agnostic `surface-signal-html` CLI for creating, rendering, importing feedback, and reading the compiler contract.
- Added standalone skills.sh install support so copied skills can use the CLI runtime when the full plugin layout is unavailable.
- Added native adapter generation for Claude Code, OpenHands, Cursor, Gemini CLI, Windsurf, Continue, Cline, Roo Code, Goose, and opencode.
- Added Claude and Cursor plugin manifests plus a `surface-signal-html install` command for Superpowers-style multi-harness packaging.
- Added public compatibility docs for Agent Skills, skills.sh, and package-based runtime use.

## 0.2.0 - 2026-05-20

- Renamed the public plugin identity and package to Surface Signal HTML.
- Added `$surface-signal-html` as the canonical router skill with `$s2-html` preserved as the shorthand alias.
- Improved Plan Studio with document-first editing, compact reviewer controls, inline decision notes, responsive review lanes, and stronger Surface Signal branding.
- Replaced the static preview asset with rendered artifact capture media.
- Corrected release and installation links to the active GitHub repository.

## 0.1.0 - 2026-05-19

- Initial public release of the Surface Signal HTML Codex plugin.
- Added the `$surface-signal-html` router skill, `$s2-html` shorthand alias, and ten specialized surface skills.
- Added the shared `surface-kit` compiler and self-contained HTML runtime.
- Added fixture rendering, runtime size checks, package dry-run support, and CI.
