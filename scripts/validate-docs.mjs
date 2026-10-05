import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const required = [
  "README.md",
  "docs/project/README.md",
  "docs/project/ARCHITECTURE.md",
  "docs/project/ROADMAP.md",
  "docs/project/CHANGELOG.md"
];
const errors = [];

for (const path of required) {
  try { await access(resolve(root, path)); }
  catch { errors.push(`Missing project document: ${path}`); }
}

const readmePath = resolve(root, "README.md");
const readme = await readFile(readmePath, "utf8");
const links = [...readme.matchAll(/\[[^\]]+\]\(([^)]+\.md)\)/g)].map(match => match[1]);
for (const link of links) {
  try { await access(resolve(dirname(readmePath), link)); }
  catch { errors.push(`README link points to missing file: ${link}`); }
}

if (/##\s+(작업 로그|Change log|Roadmap|우선 고도화한 시각화)/i.test(readme)) {
  errors.push("README should remain user-facing; project plan/change log belong in docs/project/");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Docs OK: ${required.length} required documents, ${links.length} README document links`);
