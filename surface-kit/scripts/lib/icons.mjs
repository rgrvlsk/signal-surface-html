import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

export const iconProvider = {
  name: "lucide-static",
  version: "1.16.0",
  cdnBaseUrl: "https://cdn.jsdelivr.net/npm/lucide-static@1.16.0/icons"
};

const iconManifest = {
  plus: "plus",
  copy: "copy",
  panel: "panel-top-open",
  close: "x",
  check: "check",
  x: "x",
  circle: "circle",
  clock: "clock",
  edit: "pencil",
  "arrow-up": "arrow-up",
  "arrow-down": "arrow-down",
  trash: "trash-2",
  auto: "circle-dot",
  moon: "moon",
  sun: "sun"
};

const fallbackPaths = {
  plus: ["M8 3.25v9.5", "M3.25 8h9.5"],
  copy: ["M6 5.25h6.25v7H6z", "M3.75 10.75V3.75h6.5"],
  panel: ["M3 4h10v8H3z", "M5 6h6", "M5 8h4"],
  close: ["M4.25 4.25l7.5 7.5", "M11.75 4.25l-7.5 7.5"],
  check: ["M3.5 8.25l3 3 6-6.5"],
  x: ["M4.25 4.25l7.5 7.5", "M11.75 4.25l-7.5 7.5"],
  circle: ["M8 3.75a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5z"],
  clock: ["M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z", "M8 5.75V8.4l1.9 1.1"],
  edit: ["M4 11.75l2.6-.55 5.15-5.15-2.05-2.05-5.15 5.15z", "M8.95 4.75l2.05 2.05"],
  "arrow-up": ["M8 12V4", "M4.75 7.25 8 4l3.25 3.25"],
  "arrow-down": ["M8 4v8", "M4.75 8.75 8 12l3.25-3.25"],
  trash: ["M4.25 5h7.5", "M6 5V3.75h4V5", "M5.25 5l.45 7.25h4.6L10.75 5"],
  auto: ["M8 3.25a4.75 4.75 0 0 1 0 9.5z", "M8 3.25a4.75 4.75 0 1 0 0 9.5"],
  moon: ["M11.75 10.25A4.75 4.75 0 0 1 5.75 4a5.25 5.25 0 1 0 6 6.25z"],
  sun: ["M8 4.5v-1", "M8 12.5v-1", "M4.5 8h-1", "M12.5 8h-1", "M5.5 5.5l-.7-.7", "M11.2 11.2l-.7-.7", "M10.5 5.5l.7-.7", "M4.8 11.2l.7-.7", "M8 5.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z"]
};

export async function resolveSurfaceIcons() {
  const entries = await Promise.all(
    Object.entries(iconManifest).map(async ([semanticName, lucideName]) => {
      const svg = await fetchLucideIcon(lucideName).catch(() => fallbackSvg(semanticName));
      return [semanticName, svg];
    })
  );

  return {
    provider: {
      ...iconProvider,
      manifest: iconManifest,
      mode: "build-time-inline"
    },
    svg: Object.fromEntries(entries)
  };
}

async function fetchLucideIcon(iconName) {
  const cached = await readCache(iconName);
  if (cached) {
    return normalizeSvg(cached, iconName);
  }

  const url = `${iconProvider.cdnBaseUrl}/${iconName}.svg`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const svg = await response.text();
  await writeCache(iconName, svg);
  return normalizeSvg(svg, iconName);
}

async function readCache(iconName) {
  return readFile(cachePath(iconName), "utf8").catch(() => null);
}

async function writeCache(iconName, svg) {
  await mkdir(cacheDir(), { recursive: true });
  await writeFile(cachePath(iconName), svg);
}

function cacheDir() {
  return join(tmpdir(), "surface-signal-html-icon-cache", `${iconProvider.name}-${iconProvider.version}`);
}

function cachePath(iconName) {
  return join(cacheDir(), `${iconName}.svg`);
}

function normalizeSvg(svg, iconName) {
  if (/<script|on\w+=|href=/i.test(svg)) {
    throw new Error(`Unsafe SVG content for ${iconName}`);
  }

  const viewBox = svg.match(/\bviewBox="([^"]+)"/)?.[1] || "0 0 24 24";
  const body = svg
    .replace(/^[\s\S]*?<svg\b[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .trim();

  return `<svg class="action-icon" data-lucide="${escapeAttribute(iconName)}" viewBox="${escapeAttribute(viewBox)}" aria-hidden="true" focusable="false">${body}</svg>`;
}

function fallbackSvg(semanticName) {
  const paths = fallbackPaths[semanticName] || fallbackPaths.circle;
  return `<svg class="action-icon" data-lucide-fallback="${escapeAttribute(semanticName)}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${paths.map((path) => `<path d="${escapeAttribute(path)}"></path>`).join("")}</svg>`;
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
