import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

export const defaultTempRoot = "/tmp/surface-signal-html";

export function slugify(value) {
  return String(value || "surface")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "surface";
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeJson(path, value) {
  await ensureDir(join(path, ".."));
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeText(path, value) {
  await ensureDir(join(path, ".."));
  await writeFile(path, value);
}

async function collectFiles(root, acc = []) {
  try {
    const info = await stat(root);
    if (info.isFile()) {
      acc.push(root);
      return acc;
    }
    if (!info.isDirectory()) {
      return acc;
    }
  } catch {
    return acc;
  }

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store") {
      continue;
    }
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(path, acc);
    } else if (entry.isFile()) {
      acc.push(path);
    }
  }
  return acc;
}

export async function computeSourceHash(projectRoot) {
  const roots = [join(projectRoot, "src"), join(projectRoot, "feedback")];
  const files = [];
  for (const root of roots) {
    files.push(...await collectFiles(root));
  }

  const hash = createHash("sha256");
  for (const path of files.sort()) {
    hash.update(relative(projectRoot, path));
    hash.update("\0");
    hash.update(await readFile(path));
    hash.update("\0");
  }

  return hash.digest("hex").slice(0, 16);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

export function normalizeDocument(spec) {
  const document = spec.document && typeof spec.document === "object" ? spec.document : {};
  const sections = Array.isArray(document.sections) ? document.sections : [];
  return {
    sections: sections.map((section, sectionIndex) => ({
      id: section.id || `section-${sectionIndex + 1}`,
      title: section.title || `Section ${sectionIndex + 1}`,
      blocks: Array.isArray(section.blocks)
        ? section.blocks.map((block, blockIndex) => ({
            id: block.id || `${section.id || "section"}-block-${blockIndex + 1}`,
            kind: block.kind || "text",
            title: block.title || "",
            body: block.body || ""
          }))
        : [],
      items: Array.isArray(section.items)
        ? section.items.map((item, itemIndex) => ({
            id: item.id || `${section.id || "section"}-item-${itemIndex + 1}`,
            title: item.title || `Item ${itemIndex + 1}`,
            body: item.body || "",
            status: item.status || "pending",
            impact: item.impact || "",
            references: Array.isArray(item.references) ? item.references : [],
            details: item.details || ""
          }))
        : []
    }))
  };
}

export function defaultThemeCss() {
  return [
    ":root {",
    "  --surface-accent: #0f766e;",
    "  --surface-accent-2: #b45309;",
    "}",
    ""
  ].join("\n");
}

export function defaultAppJsx() {
  return [
    "// Artifact-specific composition belongs here when needed.",
    "// The compiled dist/index.html is disposable; edit src/ and rebuild instead.",
    ""
  ].join("\n");
}

export function safeArtifactId(spec) {
  return slugify(spec.artifactId || spec.title || `${basename(process.cwd())}-${Date.now()}`);
}
