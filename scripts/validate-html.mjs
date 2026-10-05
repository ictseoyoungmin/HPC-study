import { readFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const file = join(root, "index.html");
const html = await readFile(file, "utf8");
const errors = [];

for (const needle of ["<!doctype html>", 'id="app"', 'type="module"', "assets/js/main.js", "assets/css/app.css"]) {
  if (!html.toLowerCase().includes(needle.toLowerCase())) errors.push(`index.html missing: ${needle}`);
}

const refs = [...html.matchAll(/(?:src|href)=["'](\.\/[^"'#?]+)["']/g)].map(match => match[1]);
for (const ref of refs) {
  const target = resolve(dirname(file), ref);
  try { await access(target); }
  catch { errors.push(`index.html references missing file: ${ref}`); }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`HTML OK: ${refs.length} local asset references`);
