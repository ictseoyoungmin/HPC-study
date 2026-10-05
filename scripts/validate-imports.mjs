import { readFile, readdir, access } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const roots = [join(root, "assets", "js"), join(root, "content")];
const files = [];
const errors = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extname(path) === ".js") files.push(path);
  }
}
for (const dir of roots) await walk(dir);

for (const file of files) {
  const source = await readFile(file, "utf8");
  const imports = [...source.matchAll(/(?:import|export)\s+(?:[^"']+?\s+from\s+)?["'](\.[^"']+)["']/g)].map(match => match[1]);
  for (const specifier of imports) {
    const target = resolve(dirname(file), specifier);
    try { await access(target); }
    catch { errors.push(`${relative(root, file)} -> missing ${specifier}`); }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Imports OK: ${files.length} modules`);
