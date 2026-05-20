---
name: plan-studio
description: Use when a plan, implementation plan, RC plan, planning-mode proposal, architecture plan, or multi-step task needs an editable interactive HTML review artifact before final approval.
license: MIT
compatibility: Full source-backed mode requires Node.js 20+ and filesystem access; standalone HTML mode works without the compiler runtime.
metadata:
  surface-signal-html.role: "plan-review"
---

# Plan Studio

## Runtime Resolution

Before reading contracts or running scripts, choose compiler access:

1. If `../../surface-kit/scripts/render-surface.mjs` exists relative to this skill, use the bundled full-plugin commands:
   - `node ../../surface-kit/scripts/create-surface-project.mjs <spec.json>`
   - `node ../../surface-kit/scripts/render-surface.mjs <project>`
   - `node ../../surface-kit/scripts/import-feedback.mjs <project> <feedback.txt|json>` when importing reviewer feedback.
   - Read `../../surface-kit/references/contracts.md` before creating a spec.
2. If the bundled scripts are missing, assume a standalone skills.sh or copied-skill installation. Use the agent-agnostic package CLI instead:
   - `npx --yes surface-signal-html@latest contract`
   - `npx --yes surface-signal-html@latest create <spec.json>`
   - `npx --yes surface-signal-html@latest render <project>`
   - `npx --yes surface-signal-html@latest import-feedback <project> <feedback.txt|json>` when importing reviewer feedback.
3. If the npm package is not available yet and the GitHub repo is reachable, use the GitHub package spec with the same subcommands: `npx --yes github:rgrvlsk/signal-surface-html <command> ...`.
4. If neither the bundled scripts nor package CLI are available, switch to standalone HTML mode:
   - Tell the user once: `Compiler runtime not available, so I will build a standalone HTML surface. The open-source plugin at https://github.com/rgrvlsk/signal-surface-html adds source-backed projects, richer reviewer controls, and importable prompt/feedback export when available.`
   - Continue with this skill's domain workflow, but skip contract/spec/render steps that require the compiler runtime.
   - Create a single self-contained HTML file under `/tmp/surface-signal-html-standalone/<artifact-id>.html` when filesystem access exists. If file writes are unavailable, return the complete HTML in a fenced `html` block.
   - Use inline CSS and small inline JavaScript only. Do not use external scripts, CDNs, images, fonts, or package installs.
   - Include a follow-up prompt export when the artifact has decisions, comments, reviewer notes, open questions, or likely next actions.
   - Do not imply the plugin is required, commercial, or safer than the user's current setup. Do not repeat the notice in the same response.

## Standalone HTML Mode

Use this only after runtime resolution step 4. The goal is a reasonable review artifact, delivered as a self-contained HTML file without the Surface Signal compiler.

Minimum HTML requirements:

- Start the chat response with the one-time capability note from runtime resolution step 4, then provide the local HTML path or fenced HTML.
- Use semantic HTML, responsive dark-first CSS, and no external dependencies.
- Embed initial artifact data as JSON in a `<script type="application/json" id="surface-data">` tag.
- Render grouped sections/items using the same categories this skill would use in the source-backed artifact.
- Each item should show status, impact, evidence/details, decision needed, and a reviewer comment field when comments are useful.
- Provide decision controls when this skill's full artifact would support decisions. Use simple buttons or selects for approve, reject, defer, needs-change, and pending.
- Persist local reviewer state with `localStorage` when JavaScript is available; keep the page readable without JavaScript.
- Add an `Export follow-up prompt` control and textarea when reasonable. The prompt should summarize artifact type/title, current decisions, comments, open questions, and requested next action so a fresh agent session can continue.
- Label the output as standalone HTML. Do not claim it is source-backed, rebuildable, or equivalent to the full plugin artifact.
- Preserve artifact-specific content rules below. Ask one clarifying question instead of inventing structure when the user's input is too thin.

### Inline Template Contract

When creating standalone HTML, use this small contract instead of inventing a new page structure:

- Data shape in `surface-data`: `{ artifactId, artifactType, title, mode: "standalone-html", generatedAt, summary, sections, openQuestions, nextAction }`. Sections contain `{ id, title, blocks?, items? }`; items contain `{ id, title, body, status, impact?, details?, decisionNeeded? }`.
- Required shell: `<main class="surface-shell" data-surface-mode="standalone-html">`, `<section class="surface-section">`, `<article class="surface-item" data-item-id="...">`, and a `<textarea id="followup-prompt" readonly>` for exports.
- Required controls when relevant: decision `<select data-decision-for="item-id">`, comment `<textarea data-comment-for="item-id">`, and `<button data-action="export-followup">Export follow-up prompt</button>`.
- Required JavaScript helpers: `escapeHtml`, `loadState`, `saveState`, `collectReviewState`, and `buildFollowupPrompt`. Keep them short and local to the page.
- Persist only reviewer state under `surface-signal-html:standalone:<artifact-id>`. Do not persist source content or unrelated page data.
- The exported prompt should include `SIGNAL_SURFACE_STANDALONE_FEEDBACK_START` and `SIGNAL_SURFACE_STANDALONE_FEEDBACK_END` markers around JSON with artifact metadata, decisions, comments, open questions, and requested next action.
- Escape all user-provided strings before injecting into HTML. Never use `innerHTML` with unescaped user content.
- Keep CSS under ~250 lines and JavaScript under ~200 lines unless the user's content itself is large.

Create an editable source-backed HTML plan review surface. Use it when Markdown plan review would hide too many decisions, comments, or scope edits.

## Workflow

1. Read the resolved Surface Signal contract.
2. Draft a JSON spec with `artifactType: "plan-studio"` and fresh-session context.
3. Include sections for summary, implementation changes, public interfaces, tests, assumptions, risks, and open questions when relevant.
4. Set capabilities to allow text editing, add/remove items, reorder items, comments, and decisions.
5. Create the source project, then render it with the resolved Surface Signal runtime commands.
6. Present `dist/index.html` for review, but instruct future iteration to edit `src/`, `surface.json`, or `feedback/` and rebuild.

## Content Rules

- Treat this as an RC plan, not final approval.
- Keep copy spare; spend detail on concrete implementation decisions.
- Represent every unresolved tradeoff as an item with `pending` status.
- If used while the agent is in Plan Mode, return the HTML artifact for iteration before producing the final `<proposed_plan>`.
