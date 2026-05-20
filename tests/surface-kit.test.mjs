import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const createScript = join(root, "surface-kit/scripts/create-surface-project.mjs");
const renderScript = join(root, "surface-kit/scripts/render-surface.mjs");
const importScript = join(root, "surface-kit/scripts/import-feedback.mjs");
const sizeScript = join(root, "surface-kit/scripts/check-runtime-size.mjs");
const cliScript = join(root, "bin/surface-signal-html.mjs");
const fixture = join(root, "fixtures/plan-studio.json");

function run(args) {
  const result = spawnSync("node", args, {
    cwd: root,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(
      `Command failed: node ${args.join(" ")}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`
    );
  }

  return result.stdout.trim();
}

test("creates a temporary source project with source files as the authority", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const stdout = run([createScript, fixture, "--out", out]);
  const payload = JSON.parse(stdout);

  assert.equal(payload.projectRoot, join(out, "plan-studio-fixture"));
  assert.match(payload.sourceHash, /^[a-f0-9]{16}$/);
  assert.ok(await stat(join(payload.projectRoot, "surface.json")));
  assert.ok(await stat(join(payload.projectRoot, "src/document.json")));
  assert.ok(await stat(join(payload.projectRoot, "src/theme.css")));
  assert.ok(await stat(join(payload.projectRoot, "feedback")));

  await rm(out, { recursive: true, force: true });
});

test("package CLI wraps source project creation and rendering", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-cli-test-"));
  const created = JSON.parse(run([cliScript, "create", fixture, "--out", out]));
  const rendered = JSON.parse(run([cliScript, "render", created.projectRoot]));
  const contract = run([cliScript, "contract"]);

  assert.equal(created.projectRoot, join(out, "plan-studio-fixture"));
  assert.equal(rendered.outputFile, join(created.projectRoot, "dist/index.html"));
  assert.match(contract, /Source Project Rule/);
  assert.ok(await stat(rendered.outputFile));

  await rm(out, { recursive: true, force: true });
});

test("renders self-contained disposable HTML from the source project", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.equal(rendered.outputFile, join(project, "dist/index.html"));
  assert.match(rendered.sourceHash, /^[a-f0-9]{16}$/);
  assert.match(html, /data-surface-signal-output="compiled"/);
  assert.match(html, /plan-studio-fixture/);
  assert.doesNotMatch(html, /<(script|link|img|iframe)\b[^>]+(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html, /mermaid/i);
  assert.doesNotMatch(html, /chart\.js/i);

  const source = JSON.parse(readFileSync(join(project, "surface.json"), "utf8"));
  assert.equal(source.sourceHash, rendered.sourceHash);

  await rm(out, { recursive: true, force: true });
});

test("renders dark-first UX controls without visible agent-only notes", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /color-scheme:\s*dark light/);
  assert.match(html, /surface-signal-html-theme/);
  assert.match(html, /prompt-drawer/);
  assert.match(html, /shortcut-legend/);
  assert.match(html, /Prompt/);
  assert.match(html, /select\(\)/);
  assert.doesNotMatch(html, /surface-meta/);
  assert.doesNotMatch(html, />Auto</);
  assert.doesNotMatch(html, /Disposable output/);

  await rm(out, { recursive: true, force: true });
});

test("theme switch uses detected dark or light mode with icon-only controls", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const contracts = readFileSync(join(root, "surface-kit/references/contracts.md"), "utf8");

  assert.doesNotMatch(runtime, /value:\s*"auto"/);
  assert.doesNotMatch(runtime, /<span class="button-label">\{option\.label\}<\/span>/);
  assert.match(runtime, /resolveSystemTheme/);
  assert.doesNotMatch(contracts, /auto,\s*dark,\s*and light/);
});

test("detail preformatted blocks wrap instead of horizontal scrolling", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /pre\s*\{[\s\S]*?white-space:\s*pre-wrap/);
  assert.match(html, /pre\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);

  await rm(out, { recursive: true, force: true });
});

test("card action buttons are reviewer CTAs only", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const icons = readFileSync(join(root, "surface-kit/scripts/lib/icons.mjs"), "utf8");
  const actionStatusDeclaration = runtime.match(/const reviewActionStatuses\s*=\s*\[[^\]]+\]/)?.[0] || "";

  assert.match(runtime, /const reviewActionStatuses\s*=\s*\[[\s\S]*"approved"[\s\S]*"rejected"[\s\S]*"deferred"[\s\S]*"needs_change"[\s\S]*\]/);
  assert.doesNotMatch(actionStatusDeclaration, /"pending"/);
  assert.doesNotMatch(runtime, /Object\.entries\(statusMeta\)\.map/);
  assert.match(runtime, /actionLabel:\s*"Approve"/);
  assert.match(runtime, /actionLabel:\s*"Reject"/);
  assert.match(runtime, /actionLabel:\s*"Defer"/);
  assert.match(runtime, /actionLabel:\s*"Request changes"/);
  assert.doesNotMatch(runtime, />Up<\/ActionButton>/);
  assert.doesNotMatch(runtime, />Down<\/ActionButton>/);
  assert.doesNotMatch(runtime, />Remove<\/ActionButton>/);
  assert.doesNotMatch(runtime, /function StatusBadge/);
  assert.doesNotMatch(icons, /arrow-up|arrow-down|trash|auto/);
});

test("plan-studio renders as a collapsible editable document", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /plan-document/);
  assert.match(html, /doc-section/);
  assert.match(html, /doc-block/);
  assert.match(html, /decision-dock/);
  assert.match(html, /doc-section-summary/);
  assert.doesNotMatch(html, /class="content-section"/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio uses a fixed sidebar and reserved review lane", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const planDocument = runtime.slice(
    runtime.indexOf("function PlanStudioDocument"),
    runtime.indexOf("function EditableText")
  );

  assert.match(html, /--surface-sidebar-width:\s*248px/);
  assert.match(html, /\.surface-shell\s*\{[\s\S]*?grid-template-columns:\s*var\(--surface-sidebar-width\)\s+minmax\(0,\s*1fr\)/);
  assert.match(html, /\.surface-nav\s*\{[\s\S]*?width:\s*var\(--surface-sidebar-width\)/);
  assert.match(html, /--decision-lane-width:\s*190px/);
  assert.match(html, /\.doc-block\.reviewable-block\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+var\(--decision-lane-width\)/);
  assert.match(html, /\.doc-block\.reviewable-block\s*\{[\s\S]*?padding:\s*30px 0 34px 14px/);
  assert.match(planDocument, /<DecisionDock/);
  assert.doesNotMatch(planDocument, /<StatusBadge/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio has an xs decision lane layout for narrow viewports", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?--decision-lane-width:\s*118px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.doc-block\.reviewable-block\s*\{[\s\S]*?gap:\s*14px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-status-stack\s*\{[\s\S]*?padding-top:\s*78px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-status-icon\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-status-icon\s*\{[\s\S]*?left:\s*0/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-dock-actions\s*\{[\s\S]*?display:\s*grid/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-dock-actions\s*\{[\s\S]*?left:\s*40px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*32px\)/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-note-form\s*\{[\s\S]*?top:\s*88px/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio uses a compact xs shell and document-first section chrome", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-shell\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-nav\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-nav\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-nav\s*\{[\s\S]*?top:\s*0/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.brand\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.header-tools\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.header-tools\s+\.button-label\s*\{[\s\S]*?display:\s*none/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-nav\s+nav\s*\{[\s\S]*?display:\s*flex/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-nav\s+nav\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.nav-item\s*\{[\s\S]*?flex:\s*0 0 auto/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-header\s*\{[\s\S]*?padding:\s*16px 16px 14px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.surface-header\s+h1\s*\{[\s\S]*?font-size:\s*28px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.doc-section\s*\{[\s\S]*?background:\s*transparent/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.doc-section-summary\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.doc-section-summary\s*\{[\s\S]*?top:\s*96px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.doc-section-action\s+\.button-label\s*\{[\s\S]*?display:\s*none/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio shows Surface Signal identity and icon tooltips", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");

  assert.match(runtime, /function skillTitleForArtifact/);
  assert.match(runtime, /plan-studio":\s*"Plan Studio"/);
  assert.match(runtime, /<BrandIcon/);
  assert.match(html, /brand-icon/);
  assert.match(runtime, /aria-label="Surface Signal"/);
  assert.match(runtime, /<span>\{skillTitle\}<\/span>/);
  assert.doesNotMatch(html, />plan-studio</);
  assert.match(runtime, /title=\{title \|\| label \|\| shortcut\?\.label \|\| ""\}/);
  assert.match(runtime, /<button type="button" class="legend-toggle"[\s\S]*?title="Keyboard shortcuts"/);
  assert.match(runtime, /title=\{nextMeta\.actionLabel\}/);
  assert.match(runtime, /title=\{`\$\{option\.label\} theme`\}/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio add block uses a compact round icon button", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");

  assert.match(runtime, /className="doc-section-action icon-button-round"/);
  assert.match(runtime, /title="Add block"/);
  assert.match(html, /\.icon-button-round\s*\{[\s\S]*?border-radius:\s*999px/);
  assert.match(html, /\.icon-button-round\s*\{[\s\S]*?width:\s*34px/);
  assert.match(html, /\.icon-button-round\s+\.button-label\s*\{[\s\S]*?display:\s*none/);
  assert.match(html, /\.icon-button-round\s+\.shortcut-hint\s*\{[\s\S]*?display:\s*none/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio comments edit as an inline contenteditable list", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const styles = readFileSync(join(root, "surface-kit/runtime/styles.css"), "utf8");
  const commentBox = runtime.slice(
    runtime.indexOf("function CommentBox"),
    runtime.indexOf("function buildPrompt")
  );
  const commentFocusRule = styles.match(/\.comment-list-row:focus\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(runtime, /function upsertComment/);
  assert.match(runtime, /useLayoutEffect/);
  assert.match(runtime, /comment\.id === commentId/);
  assert.match(runtime, /filter\(\(comment\) => comment\.id !== commentId\)/);
  assert.match(commentBox, /class="comment-list"/);
  assert.match(commentBox, /const commentRows = \[/);
  assert.match(commentBox, /class=\{`comment-list-row \$\{className\}`\.trim\(\)\}/);
  assert.match(commentBox, /contentEditable/);
  assert.match(commentBox, /placeholder="Add comment"/);
  assert.match(commentBox, /data-placeholder=\{placeholder\}/);
  assert.match(commentBox, /promotedCommentIds = useRef\(new Set\(\)\)/);
  assert.match(commentBox, /pendingFocus = useRef\(null\)/);
  assert.match(commentBox, /promotedCommentIds\.current\.has\(commentId\)/);
  assert.match(commentBox, /pendingFocus\.current = \{ id: commentId, offset: text\.length \}/);
  assert.match(commentBox, /setDraftId\(`\$\{targetId\}-comment-\$\{Date\.now\(\)\}`\)/);
  assert.doesNotMatch(commentBox, /<form/);
  assert.doesNotMatch(commentBox, /<input/);
  assert.doesNotMatch(commentBox, />Add<\/ActionButton>/);
  assert.match(styles, /\.comment-list\s*\{[\s\S]*?list-style:\s*disc/);
  assert.match(styles, /\.comment-list-row\.is-placeholder:empty::before\s*\{[\s\S]*?content:\s*attr\(data-placeholder\)/);
  assert.doesNotMatch(styles, /\.doc-block\s+\.comments\s*\{[\s\S]*?position:\s*absolute/);
  assert.doesNotMatch(styles, /\.doc-block:hover\s+\.comments/);
  assert.doesNotMatch(styles, /\.doc-block:focus-within\s+\.comments/);
  assert.doesNotMatch(commentFocusRule, /(background|border|padding|margin|display|position):/);
  assert.match(commentBox, /function handleCommentKeyDown/);
  assert.match(commentBox, /document\.activeElement === node/);
  assert.match(commentBox, /event\.key === "Enter"/);
  assert.match(commentBox, /event\.key === "Backspace"/);
  assert.match(commentBox, /event\.key === "ArrowUp"/);
  assert.match(commentBox, /event\.key === "ArrowDown"/);
  assert.match(commentBox, /focusCommentRow\(newId,\s*0\)/);
  assert.match(commentBox, /focusCommentRow\(previous,\s*previous\.textContent\.length\)/);
});

test("plan-studio separates document blocks with gutter instead of bottom borders", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const docSectionBodyRule = html.match(/\.doc-section-body\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const docBlockRule = html.match(/\.doc-block\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(docSectionBodyRule, /gap:\s*14px/);
  assert.match(docBlockRule, /border-bottom:\s*0/);
  assert.doesNotMatch(docBlockRule, /border-bottom:\s*1px/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio decision actions are reserved icon-only controls", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const decisionDock = runtime.slice(
    runtime.indexOf("function DecisionDock"),
    runtime.indexOf("function EditableText")
  );

  assert.match(html, /\.decision-dock-actions\s*\{[\s\S]*?opacity:\s*0/);
  assert.match(html, /\.decision-dock-actions\s*\{[\s\S]*?pointer-events:\s*none/);
  assert.match(html, /\.doc-block:hover\s+\.decision-dock-actions/);
  assert.match(html, /\.doc-block:focus-within\s+\.decision-dock-actions/);
  assert.match(html, /\.decision-round\s*\{[\s\S]*?border-radius:\s*999px/);
  assert.match(html, /\.decision-round\s*\{[\s\S]*?width:\s*32px/);
  assert.match(decisionDock, /aria-label=\{nextMeta\.actionLabel\}/);
  assert.doesNotMatch(decisionDock, /button-label/);
  assert.doesNotMatch(decisionDock, />\{meta\.actionLabel\}</);
  assert.match(runtime, /showShortcutBadges=\{shortcutOpen \|\| superKeyActive\}/);
  assert.match(decisionDock, /showShortcutBadges && shortcut/);
  assert.match(html, /\.decision-keycap/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio decision note uses a three-line editor and italic persisted note", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const decisionDock = runtime.slice(
    runtime.indexOf("function DecisionDock"),
    runtime.indexOf("function EditableText")
  );

  assert.match(decisionDock, /reviewComment/);
  assert.match(decisionDock, /setEditorOpen\(true\)/);
  assert.match(decisionDock, /onSaveComment\(draft\.trim\(\)\)/);
  assert.match(decisionDock, /class="decision-note-form"/);
  assert.match(decisionDock, /class="decision-note-input"/);
  assert.match(decisionDock, /class="decision-note-save"/);
  assert.match(decisionDock, /class="decision-note"/);
  assert.match(decisionDock, /<textarea[\s\S]*?rows=\{3\}/);
  assert.doesNotMatch(decisionDock, /<input[\s\S]*?class="decision-note-input"/);
  assert.match(decisionDock, /const showEditor = editorOpen && isActive/);
  assert.match(decisionDock, /currentStatus !== "pending"/);
  assert.match(decisionDock, /class="decision-note-trigger"/);
  assert.match(decisionDock, /if \(!isActive && editorOpen\)/);
  assert.match(decisionDock, /noteInputRef\.current\?\.focus\(\)/);
  assert.match(decisionDock, /ref=\{noteInputRef\}/);
  assert.match(runtime, /onUpdateItem\(section\.id,\s*item\.id,\s*\{\s*reviewComment\s*\}\)/);
  assert.match(html, /\.decision-note-form\s*\{[\s\S]*?--decision-note-save-size:\s*28px/);
  assert.match(html, /\.decision-note-form\s*\{[\s\S]*?--decision-note-save-inset:\s*5px/);
  assert.match(html, /\.decision-note-form\s*\{[\s\S]*?--decision-note-corner-radius:\s*19px/);
  assert.match(html, /\.decision-note-form\s*\{[\s\S]*?border-radius:\s*14px/);
  assert.match(html, /\.decision-note-form\s*\{[\s\S]*?border-bottom-right-radius:\s*var\(--decision-note-corner-radius\)/);
  assert.match(html, /\.decision-note-save\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(html, /\.decision-note-save\s*\{[\s\S]*?right:\s*var\(--decision-note-save-inset\)/);
  assert.match(html, /\.decision-note-save\s*\{[\s\S]*?bottom:\s*var\(--decision-note-save-inset\)/);
  assert.match(html, /\.decision-note-save\s*\{[\s\S]*?width:\s*var\(--decision-note-save-size\)/);
  assert.match(html, /\.decision-note-input\s*\{[\s\S]*?min-height:\s*72px/);
  assert.match(html, /\.decision-note\s*\{[\s\S]*?font-style:\s*italic/);
  assert.match(html, /\.decision-note\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(html, /\.decision-note-trigger\s*\{[\s\S]*?background:\s*transparent/);
  assert.match(html, /\.decision-note-trigger\s*\{[\s\S]*?opacity:\s*0\.48/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-note-form\s*\{[\s\S]*?--decision-note-save-size:\s*30px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-note-form\s*\{[\s\S]*?--decision-note-save-inset:\s*6px/);
  assert.match(html, /@media\s*\(max-width:\s*720px\)[\s\S]*?\.decision-note-form\s*\{[\s\S]*?--decision-note-corner-radius:\s*21px/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio touch fallback exposes reserved icon decisions without labels", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /@media\s*\(hover:\s*none\)[\s\S]*?\.decision-dock-actions\s*\{[\s\S]*?opacity:\s*1/);
  assert.match(html, /@media\s*\(hover:\s*none\)[\s\S]*?\.decision-dock-actions\s*\{[\s\S]*?pointer-events:\s*auto/);

  await rm(out, { recursive: true, force: true });
});

test("plan-studio text edits inline without textarea focus reflow", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const styles = readFileSync(join(root, "surface-kit/runtime/styles.css"), "utf8");
  const planDocument = runtime.slice(
    runtime.indexOf("function PlanStudioDocument"),
    runtime.indexOf("function DecisionActions")
  );
  const focusRule = styles.match(/\.doc-editable:focus\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(runtime, /function EditableText/);
  assert.match(runtime, /contentEditable/);
  assert.match(planDocument, /doc-editable-title/);
  assert.match(planDocument, /doc-editable-summary/);
  assert.match(planDocument, /doc-editable-body/);
  assert.match(planDocument, /onUpdateBlock\(section\.id,\s*block\.id,\s*\{\s*title\s*\}\)/);
  assert.match(planDocument, /onUpdateBlock\(section\.id,\s*block\.id,\s*\{\s*body\s*\}\)/);
  assert.match(planDocument, /onUpdateItem\(section\.id,\s*item\.id,\s*\{\s*title\s*\}\)/);
  assert.match(planDocument, /onUpdateItem\(section\.id,\s*item\.id,\s*\{\s*impact\s*\}\)/);
  assert.match(planDocument, /onUpdateItem\(section\.id,\s*item\.id,\s*\{\s*body\s*\}\)/);
  assert.doesNotMatch(planDocument, /<textarea[\s\S]*?doc-textarea/);
  assert.doesNotMatch(styles, /\.doc-textarea/);
  assert.match(focusRule, /background:/);
  assert.doesNotMatch(focusRule, /padding:/);
  assert.doesNotMatch(focusRule, /border(?:-color)?:/);
});

test("plan-studio supports editable unordered and ordered body lists", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const documentPath = join(project, "src/document.json");
  const document = JSON.parse(readFileSync(documentPath, "utf8"));
  document.sections[1].items[0].body = [
    "- Add resolver behind current call sites",
    "- Keep returning the legacy decision",
    "- Compare resolver and legacy outcomes"
  ].join("\n");
  document.sections[0].items[0].body = [
    "1. Switch admin screens after project access is clean",
    "2. Gate admin features behind a revert flag",
    "3. Validate no admin-only regressions"
  ].join("\n");
  writeFileSync(documentPath, `${JSON.stringify(document, null, 2)}\n`);

  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");

  assert.match(html, /doc-list doc-list-unordered/);
  assert.match(html, /doc-list doc-list-ordered/);
  assert.match(runtime, /const ListTag = type === "ordered" \? "ol" : "ul"/);
  assert.match(runtime, /<ListTag class=\{listClass\}/);
  assert.match(runtime, /<li\s+class="doc-list-row"/);
  assert.match(runtime, /<li class="doc-list-add-row">/);
  assert.match(html, /doc-list-row/);
  assert.match(html, /doc-list-handle/);
  assert.match(html, /draggable/);
  assert.match(html, /doc-list-remove/);
  assert.match(html, /Remove list item/);
  assert.match(html, /doc-list-add/);
  assert.match(html, /Add item/);
  assert.match(html, /\.doc-list-add-row\s*\{[\s\S]*?min-height:\s*28px/);
  assert.match(html, /\.doc-list-add\s*\{[\s\S]*?opacity:\s*0/);
  assert.match(html, /\.doc-block:focus-within\s+\.doc-list-add/);
  assert.match(html, /\.doc-list-row\s*\{[\s\S]*?position:\s*relative/);
  assert.match(html, /\.doc-list-row\s*\{[\s\S]*?grid-template-columns:\s*28px minmax\(0,\s*1fr\)/);
  assert.match(html, /\.doc-list-handle\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(html, /\.doc-list-handle\s*\{[\s\S]*?background:\s*color-mix\(in srgb,\s*var\(--surface-panel\),\s*var\(--section-accent\) 4%\)/);
  assert.match(html, /\.doc-list-handle::before\s*\{[\s\S]*?width:\s*9px/);
  assert.match(html, /\.doc-list-handle::before\s*\{[\s\S]*?height:\s*15px/);
  assert.match(html, /\.doc-list-handle::before\s*\{[\s\S]*?background-size:\s*6px 6px/);
  assert.match(html, /\.doc-list-row:hover\s+\.doc-list-handle/);
  assert.match(html, /\.doc-list-remove\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(html, /\.doc-list-remove\s*\{[\s\S]*?right:\s*-22px/);
  assert.match(runtime, /function serializeListBody/);
  assert.match(runtime, /function parseListBody/);
  assert.match(runtime, /function moveListItem/);

  await rm(out, { recursive: true, force: true });
});

test("ordered body list serialization always renumbers after edits", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const serializer = runtime.match(/function serializeListBody\([\s\S]*?\n\}/)?.[0] || "";

  assert.match(serializer, /type === "ordered"/);
  assert.match(serializer, /index \+ 1/);
  assert.match(serializer, /`\$\{index \+ 1\}\. \$\{item\}`/);
});

test("plan-studio details are visible editable secondary text", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const styles = readFileSync(join(root, "surface-kit/runtime/styles.css"), "utf8");
  const planDocument = runtime.slice(
    runtime.indexOf("function PlanStudioDocument"),
    runtime.indexOf("function DecisionActions")
  );

  assert.match(planDocument, /doc-editable-details/);
  assert.match(planDocument, /onUpdateItem\(section\.id,\s*item\.id,\s*\{\s*details\s*\}\)/);
  assert.doesNotMatch(planDocument, /<details class="doc-details"/);
  assert.doesNotMatch(planDocument, /<pre>\{item\.details\}<\/pre>/);
  assert.match(styles, /\.doc-editable-details\s*\{[\s\S]*?color:\s*var\(--surface-muted\)/);
  assert.match(styles, /\.doc-editable-details\s*\{[\s\S]*?font-size:\s*14px/);
});

test("plan-studio keeps legacy comments scoped away from decision notes", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const planDocument = runtime.slice(
    runtime.indexOf("function PlanStudioDocument"),
    runtime.indexOf("function EditableText")
  );

  assert.match(planDocument, /text-doc-block[\s\S]*?<CommentBox/);
  assert.doesNotMatch(planDocument, /reviewable-block[\s\S]*?<CommentBox/);
  assert.match(html, /\.decision-note-form/);

  await rm(out, { recursive: true, force: true });
});

test("renders compact icon buttons with subtle shortcut glyphs", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /action-button/);
  assert.match(html, /action-icon/);
  assert.match(html, /shortcut-hint/);
  assert.match(html, /\.shortcut-hint\s*\{[\s\S]*?border:/);
  assert.match(html, /\.shortcut-hint\s*\{[\s\S]*?box-shadow:\s*inset/);
  assert.match(html, /aria-keyshortcuts/);
  assert.match(html, /data-icon/);
  assert.doesNotMatch(html, /(?:◐|\\u25d0|◑|\\u25d1|☼|\\u263c|↵|\\u21b5|⌫|\\u232b|✓|\\u2713|×|\\xd7|✎|\\u270e|◌|\\u25cc)/i);

  await rm(out, { recursive: true, force: true });
});

test("shortcuts are declared once and scoped away from form controls", () => {
  const runtime = readFileSync(join(root, "surface-kit/runtime/main.jsx"), "utf8");
  const typingGuard = runtime.indexOf("if (isTypingTarget(event.target))");
  const escapeShortcut = runtime.indexOf("if (event.key === \"Escape\")");

  assert.match(runtime, /const shortcutCatalog\s*=/);
  assert.match(runtime, /const statusShortcuts\s*=/);
  assert.match(runtime, /activeItemId/);
  assert.ok(typingGuard > -1, "shortcut handler must check focused form controls");
  assert.ok(escapeShortcut > -1, "escape shortcut must remain declared");
  assert.ok(typingGuard < escapeShortcut, "form control guard must run before any shortcut");
  assert.doesNotMatch(runtime, /hint:\s*"[◐◑☼✓×✎◌·]"/);
  assert.doesNotMatch(runtime, /hint=\{meta\.hint\}/);
  assert.doesNotMatch(runtime, /hint="↵"/);
});

test("cherry-picks Lucide icons from the pinned CDN at build time", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /lucide-static/);
  assert.match(html, /1\.16\.0/);
  assert.match(html, /panel-top-open/);
  assert.match(html, /data-icon-source/);
  assert.match(html, /<svg class=["']action-icon["']/);
  assert.doesNotMatch(html, /<img\b[^>]+src=["']https?:\/\//i);

  await rm(out, { recursive: true, force: true });
});

test("rebuilds from source and ignores stale compiled-html edits", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const first = JSON.parse(run([renderScript, project]));
  writeFileSync(first.outputFile, "BROKEN COMPILED EDIT");

  const documentPath = join(project, "src/document.json");
  const document = JSON.parse(readFileSync(documentPath, "utf8"));
  document.sections[0].items[0].title = "Stable API contract";
  writeFileSync(documentPath, `${JSON.stringify(document, null, 2)}\n`);

  const second = JSON.parse(run([renderScript, project]));
  const html = readFileSync(second.outputFile, "utf8");

  assert.notEqual(second.sourceHash, first.sourceHash);
  assert.match(html, /Stable API contract/);
  assert.doesNotMatch(html, /BROKEN COMPILED EDIT/);

  await rm(out, { recursive: true, force: true });
});

test("imports exported feedback into the source project feedback folder", async () => {
  const out = mkdtempSync(join(tmpdir(), "surface-signal-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const feedbackPath = join(out, "feedback.txt");
  writeFileSync(
    feedbackPath,
    [
      "SIGNAL_SURFACE_FEEDBACK_START",
      JSON.stringify({ artifactId: "plan-studio-fixture", decisions: [{ id: "keep-contract", status: "approved" }] }),
      "SIGNAL_SURFACE_FEEDBACK_END"
    ].join("\n")
  );

  const imported = JSON.parse(run([importScript, project, feedbackPath]));
  const payload = JSON.parse(readFileSync(imported.outputFile, "utf8"));

  assert.equal(payload.artifactId, "plan-studio-fixture");
  assert.equal(payload.decisions[0].status, "approved");

  await rm(out, { recursive: true, force: true });
});

test("default runtime bundle stays lean and excludes heavy visual packages", () => {
  const payload = JSON.parse(run([sizeScript, "--json"]));

  assert.ok(payload.gzipBytes < 35000, `runtime gzip too large: ${payload.gzipBytes}`);
  assert.deepEqual(payload.forbiddenImports, []);
});

test("published skill instructions stay self-contained at runtime", () => {
  const skillRoot = join(root, "skills");
  const skillText = readdirSync(skillRoot)
    .map((name) => readFileSync(join(skillRoot, name, "SKILL.md"), "utf8"))
    .join("\n");
  const contract = readFileSync(join(root, "surface-kit/references/contracts.md"), "utf8");

  assert.match(contract, /Do not invoke third-party skills/);
  assert.doesNotMatch(skillText, /frontend-design|uncodixfy|skill-creator|superpowers:/i);
});

test("plugin identity uses surface-signal-html with s2-html as shorthand alias", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const pluginJson = JSON.parse(readFileSync(join(root, ".codex-plugin/plugin.json"), "utf8"));
  const skillRoot = join(root, "skills");
  const skillNames = readdirSync(skillRoot);
  const canonical = readFileSync(join(skillRoot, "surface-signal-html/SKILL.md"), "utf8");
  const alias = readFileSync(join(skillRoot, "s2-html/SKILL.md"), "utf8");

  assert.equal(packageJson.name, "surface-signal-html");
  assert.equal(pluginJson.name, "surface-signal-html");
  assert.ok(skillNames.includes("surface-signal-html"));
  assert.ok(skillNames.includes("s2-html"));
  assert.match(canonical, /^name: surface-signal-html$/m);
  assert.match(alias, /^name: s2-html$/m);
  assert.match(alias, /alias shorthand/i);
  assert.match(alias, /\$surface-signal-html/);
  assert.match(pluginJson.interface.longDescription, /\$surface-signal-html/);
  assert.match(pluginJson.interface.longDescription, /\$s2-html/);
});

test("meta skill routes tasks and every skill has a full-installation fallback", () => {
  const skillRoot = join(root, "skills");
  const skillNames = readdirSync(skillRoot);
  const s2 = readFileSync(join(skillRoot, "surface-signal-html/SKILL.md"), "utf8");

  assert.match(s2, /meta-skill/i);
  assert.match(s2, /analy[sz]e/i);
  assert.match(s2, /choose/i);
  assert.match(s2, /confidence/i);
  assert.match(s2, /ask one clarifying question/i);

  for (const name of skillNames) {
    const text = readFileSync(join(skillRoot, name, "SKILL.md"), "utf8");
    assert.match(text, /\*\*Surface Signal HTML requires the full plugin installation\.\*\*/);
    assert.match(text, /https:\/\/github\.com\/rgrvlsk\/signal-surface-html/);
    assert.match(text, /\.\.\/\.\.\/surface-kit\/scripts\/render-surface\.mjs/);
  }
});
