// Verifies that every translatable string in the frontend exists in every locale dictionary,
// and that no dictionary carries keys the UI no longer uses. Exits non-zero on drift.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "lib", "locales");

// Strings that reach t() through a variable rather than a literal call.
const dynamicKeys = ["Unable to load portal data"];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", "locales", "tests"].includes(entry.name)) walk(full, files);
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function collectSourceKeys() {
  const keys = new Set(dynamicKeys);
  for (const file of walk(root)) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/\bt\("([^"]+)"/g)) keys.add(match[1]);
  }
  const portal = fs.readFileSync(path.join(root, "components", "portal-pages.tsx"), "utf8");
  for (const match of portal.matchAll(/\{ label: "([^"]+)", value: "[^"]+" \}/g)) keys.add(match[1]);
  const i18n = fs.readFileSync(path.join(root, "lib", "i18n.tsx"), "utf8");
  for (const match of i18n.slice(i18n.indexOf("statusLabels")).matchAll(/: "([^"]+)"/g)) keys.add(match[1]);
  const shell = fs.readFileSync(path.join(root, "components", "app-shell.tsx"), "utf8");
  for (const match of shell.matchAll(/label: "([^"]+)"/g)) keys.add(match[1]);
  const login = fs.readFileSync(path.join(root, "app", "login", "page.tsx"), "utf8");
  for (const match of login.match(/const highlights = \[([^\]]+)\]/)?.[1].matchAll(/"([^"]+)"/g) ?? []) keys.add(match[1]);
  const types = fs.readFileSync(path.join(root, "lib", "types.ts"), "utf8");
  for (const match of types.match(/export type Role =([^;]+);/)?.[1].matchAll(/"([^"]+)"/g) ?? []) keys.add(match[1]);
  return keys;
}

function collectDictionaryKeys(file) {
  const source = fs.readFileSync(file, "utf8");
  const keys = new Set();
  for (const match of source.matchAll(/^\s+"((?:[^"\\]|\\.)+)":\s+"/gm)) keys.add(match[1]);
  return keys;
}

const sourceKeys = collectSourceKeys();
let failed = false;

for (const file of fs.readdirSync(localesDir).filter((name) => name.endsWith(".ts"))) {
  const dictionaryKeys = collectDictionaryKeys(path.join(localesDir, file));
  const missing = [...sourceKeys].filter((key) => !dictionaryKeys.has(key)).sort();
  const unused = [...dictionaryKeys].filter((key) => !sourceKeys.has(key)).sort();
  console.log(`${file}: ${dictionaryKeys.size} entries, ${missing.length} missing, ${unused.length} unused`);
  for (const key of missing) console.log(`  missing: ${key}`);
  for (const key of unused) console.log(`  unused:  ${key}`);
  if (missing.length || unused.length) failed = true;
}

console.log(`${sourceKeys.size} translatable strings found in source.`);
process.exit(failed ? 1 : 0);
