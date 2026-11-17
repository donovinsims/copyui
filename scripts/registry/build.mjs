#!/usr/bin/env node
/**
 * Builds src/registry/generated.ts from the component sources.
 *
 * The registry has to serve the real file that ships in the app — not a copy that
 * drifts. Each item carries the component's source plus the small lib helpers it
 * imports, so `npx shadcn@latest add` writes a working file into any project.
 *
 *   npm run registry:build     write the artifact
 *   npm run registry:check     fail when the artifact is stale (CI)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPONENTS } from "../../registry/manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const UI_DIR = path.join(ROOT, "src", "components", "ui");
const LIB_DIR = path.join(ROOT, "src", "lib");
const OUT_FILE = path.join(ROOT, "src", "registry", "generated.ts");
const checkOnly = process.argv.includes("--check");

const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

const libFiles = new Map([
  ["css", { path: "lib/css.ts", file: "css.ts" }],
  ["utils", { path: "lib/utils.ts", file: "utils.ts" }],
  ["hooks", { path: "lib/hooks.ts", file: "hooks.ts" }],
  ["icons", { path: "lib/icons.tsx", file: "icons.tsx" }],
]);

const sources = readdirSync(UI_DIR).filter((file) => file.endsWith(".tsx"));
const declared = new Set(COMPONENTS.map((entry) => `${entry.file}.tsx`));
const missing = sources.filter((file) => !declared.has(file));
const stale = COMPONENTS.filter((entry) => !sources.includes(`${entry.file}.tsx`));

if (missing.length || stale.length) {
  if (missing.length) console.error(`[registry] components without a manifest entry: ${missing.join(", ")}`);
  if (stale.length) console.error(`[registry] manifest entries without a source file: ${stale.map((e) => e.file).join(", ")}`);
  process.exit(1);
}

const items = {};

for (const entry of COMPONENTS) {
  const slug = kebab(entry.file);
  const content = readFileSync(path.join(UI_DIR, `${entry.file}.tsx`), "utf8");
  const files = [{ path: `components/ui/${slug}.tsx`, type: "registry:ui", content }];
  const registryDependencies = [];

  for (const match of content.matchAll(/from "\.\.\/\.\.\/lib\/([a-z]+)"/g)) {
    const lib = libFiles.get(match[1]);
    if (!lib) throw new Error(`[registry] ${entry.file} imports unknown lib module "${match[1]}"`);
    if (!files.some((file) => file.path === lib.path)) {
      files.push({
        path: lib.path,
        type: "registry:lib",
        content: readFileSync(path.join(LIB_DIR, lib.file), "utf8"),
      });
    }
  }

  for (const match of content.matchAll(/from "\.\/([A-Za-z0-9]+)"/g)) {
    const dependency = kebab(match[1]);
    if (dependency !== slug && !registryDependencies.includes(dependency)) registryDependencies.push(dependency);
  }

  items[slug] = {
    name: slug,
    type: "registry:ui",
    title: entry.title,
    description: entry.description,
    categories: [entry.category],
    dependencies: [],
    registryDependencies,
    files,
  };
}

const output = `/**
 * GENERATED FILE — do not edit.
 * Source: registry/manifest.mjs + src/components/ui/*.tsx
 * Regenerate: npm run registry:build
 */
export interface RegistryFile {
  path: string;
  type: "registry:ui" | "registry:lib";
  content: string;
}

export interface RegistryItem {
  name: string;
  type: "registry:ui";
  title: string;
  description: string;
  categories: string[];
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

export const REGISTRY_ITEMS: Record<string, RegistryItem> = ${JSON.stringify(items, null, 2)};
`;

if (checkOnly) {
  const current = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, "utf8") : "";
  if (current !== output) {
    console.error("[registry] src/registry/generated.ts is stale — run npm run registry:build");
    process.exit(1);
  }
  console.log(`[registry] ${Object.keys(items).length} items up to date`);
} else {
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, output);
  const bytes = Buffer.byteLength(output);
  console.log(`[registry] wrote ${Object.keys(items).length} items (${(bytes / 1024).toFixed(0)} KB)`);
}
