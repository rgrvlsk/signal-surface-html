# Signal Surface HTML Contracts

## Source Project Rule

Every artifact is a temporary source project. `src/`, `surface.json`, and `feedback/` are authoritative. `dist/index.html` is disposable compiled output and must not be patched during normal use.

Default layout:

```text
/tmp/signal-surface-html/<artifact-id>/
  surface.json
  src/document.json
  src/content/*.md
  src/data/*.json
  src/assets/*
  src/app.jsx
  src/theme.css
  feedback/imported-feedback.json
  dist/index.html
```

If only compiled HTML exists, treat it as read-only review output. Regenerate a source project from the prompt export instead of reverse-engineering the HTML.

## Runtime Independence

Signal Surface HTML skills are self-contained when they run. Do not invoke third-party skills, design helpers, browser-design skills, or unrelated plugins to create a normal artifact. Use the current skill instructions, this contract, and the shared `surface-kit` scripts.

The `s2-html` router may select another skill from this same plugin. Development and validation work on the plugin itself may use external tooling.

## Artifact UX

- Dark mode is the default visual baseline.
- The artifact detects the viewer's system theme unless a stored theme choice exists.
- The theme control must stay subtle and allow auto, dark, and light modes.
- Keyboard shortcuts should be available where the artifact supports them, with a compact legend that stays out of the way.
- Buttons should prefer compact inline SVG icons and short labels. Add boxed shortcut glyphs only for shortcuts that are actually implemented.
- Shortcut behavior must be context-aware: global keys handle document actions, section keys handle the active section, and card action keys affect only the active card.
- Shortcuts must not fire while form controls or editable regions are focused.
- The copy-back prompt is hidden by default and opened only through the prompt controls or shortcut.
- Copy uses the Clipboard API when available. If it is unavailable or fails, the read-only prompt textarea opens and selects itself on activation for manual copy.
- Keep internal agent guidance out of the visible artifact body. Put source-edit instructions, rebuild rules, and fresh-session guidance in the exported prompt.

## Stack

- Core runtime: Preact JSX bundled by esbuild.
- Default styling: local CSS tokens and plain structural components.
- Icons: cherry-pick pinned Lucide Static SVGs from jsDelivr at build time, sanitize them, and inline only the used icons into the compiled HTML. The generated artifact must not request icon assets at runtime.
- Optional runtime modules: SortableJS, marked, DOMPurify, and uPlot only when a skill explicitly needs them.
- Build-time helpers: Shiki for static highlighted code; Mermaid CLI for inline SVG/PNG diagrams when needed.
- Forbidden in default runtime: Mermaid, Shiki, Chart.js, uPlot, runtime icon packages, SortableJS, marked, and DOMPurify.

## Default Shortcuts

- `P`: open prompt.
- `C`: copy prompt.
- `?`: open shortcut legend.
- `Esc`: close open panels when focus is outside form controls.
- `1-9`: select section.
- `N`: add an item to the active section when item creation is enabled.
- `J` / `K`: move the active card selection down or up.
- `A` / `R` / `D` / `E`: approve, reject, defer, or mark the active card as needing change when decisions are enabled.
- `Shift+J` / `Shift+K`: move the active card down or up when reordering is enabled.

## Spec Shape

Create a JSON spec for `create-surface-project.mjs`:

```json
{
  "artifactType": "plan-studio",
  "artifactId": "stable-id",
  "title": "Human title",
  "summary": "Short purpose",
  "freshSessionContext": "Context needed by a new agent session.",
  "capabilities": {
    "editText": true,
    "addRemoveItems": true,
    "reorderItems": true,
    "comments": true,
    "decisions": true
  },
  "document": {
    "sections": [
      {
        "id": "scope",
        "title": "Scope",
        "blocks": [
          { "id": "scope-copy", "kind": "text", "title": "Boundary", "body": "..." }
        ],
        "items": [
          {
            "id": "decision-1",
            "title": "Decision title",
            "body": "Decision body",
            "status": "pending",
            "impact": "Concrete consequence",
            "details": "Folded code, references, or nuance"
          }
        ]
      }
    ]
  }
}
```

## Commands

From the plugin root:

```bash
node surface-kit/scripts/create-surface-project.mjs fixtures/plan-studio.json
node surface-kit/scripts/render-surface.mjs /tmp/signal-surface-html/plan-studio-fixture
node surface-kit/scripts/import-feedback.mjs /tmp/signal-surface-html/plan-studio-fixture feedback.txt
```

## Prompt Export

The HTML must export a prompt containing:

- Artifact id and type
- Source project path
- Source hash
- Fresh-session context
- Source edit rule
- Current document state
- Comments
- Requested next action

The JSON payload is wrapped between `SIGNAL_SURFACE_FEEDBACK_START` and `SIGNAL_SURFACE_FEEDBACK_END` so `import-feedback.mjs` can preserve it.
