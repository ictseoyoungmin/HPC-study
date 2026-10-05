import { readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const targets = [join(root, "assets", "js"), join(root, "scripts")];
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if ([".js", ".mjs"].includes(extname(entry.name))) files.push(path);
  }
}

for (const dir of targets) await walk(dir);

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`Syntax error: ${relative(root, file)}`);
    console.error(result.stderr);
    process.exit(1);
  }
}
console.log(`Syntax OK: ${files.length} JavaScript files`);
