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
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
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

test("renders self-contained disposable HTML from the source project", async () => {
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.equal(rendered.outputFile, join(project, "dist/index.html"));
  assert.match(rendered.sourceHash, /^[a-f0-9]{16}$/);
  assert.match(html, /data-signal-surface-output="compiled"/);
  assert.match(html, /plan-studio-fixture/);
  assert.doesNotMatch(html, /<(script|link|img|iframe)\b[^>]+(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html, /mermaid/i);
  assert.doesNotMatch(html, /chart\.js/i);

  const source = JSON.parse(readFileSync(join(project, "surface.json"), "utf8"));
  assert.equal(source.sourceHash, rendered.sourceHash);

  await rm(out, { recursive: true, force: true });
});

test("renders dark-first UX controls without visible agent-only notes", async () => {
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
  const project = JSON.parse(run([createScript, fixture, "--out", out])).projectRoot;
  const rendered = JSON.parse(run([renderScript, project]));
  const html = readFileSync(rendered.outputFile, "utf8");

  assert.match(html, /color-scheme:\s*dark light/);
  assert.match(html, /signal-surface-html-theme/);
  assert.match(html, /prompt-drawer/);
  assert.match(html, /shortcut-legend/);
  assert.match(html, /Prompt/);
  assert.match(html, /select\(\)/);
  assert.doesNotMatch(html, /Disposable output/);

  await rm(out, { recursive: true, force: true });
});

test("renders compact icon buttons with subtle shortcut glyphs", async () => {
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
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
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
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
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
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
  const out = mkdtempSync(join(tmpdir(), "signal-surface-html-test-"));
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

test("meta skill routes tasks and every skill has a full-installation fallback", () => {
  const skillRoot = join(root, "skills");
  const skillNames = readdirSync(skillRoot);
  const s2 = readFileSync(join(skillRoot, "s2-html/SKILL.md"), "utf8");

  assert.match(s2, /meta-skill/i);
  assert.match(s2, /analy[sz]e/i);
  assert.match(s2, /choose/i);
  assert.match(s2, /confidence/i);
  assert.match(s2, /ask one clarifying question/i);

  for (const name of skillNames) {
    const text = readFileSync(join(skillRoot, name, "SKILL.md"), "utf8");
    assert.match(text, /\*\*Signal Surface HTML requires the full plugin installation\.\*\*/);
    assert.match(text, /https:\/\/github\.com\/rgrvlsk\/signal-surface-html/);
    assert.match(text, /\.\.\/\.\.\/surface-kit\/scripts\/render-surface\.mjs/);
  }
});
