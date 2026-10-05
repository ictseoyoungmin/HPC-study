import fs from "node:fs";
import path from "node:path";
import { chapters } from "../assets/js/content/index.js";
import { sources, chapterReferences } from "../assets/js/content/sources.js";

const requiredFiles = [
  "LICENSE-CODE",
  "LICENSE-CONTENT",
  "NOTICE.md",
  "CONTRIBUTING.md",
  "docs/LICENSING.md",
  "docs/SOURCES.md",
  "assets/third-party/README.md"
];

const errors = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.resolve(file))) errors.push(`Missing licensing file: ${file}`);
}

const chapterIds = new Set(chapters.map(ch => ch.id));
for (const [id, source] of Object.entries(sources)) {
  for (const key of ["title", "publisher", "url", "license", "usage"]) {
    if (!String(source[key] || "").trim()) errors.push(`Source ${id}: missing ${key}`);
  }
  if (!/^https:\/\//.test(source.url || "")) errors.push(`Source ${id}: URL must be https`);
}

for (const [chapterId, sourceIds] of Object.entries(chapterReferences)) {
  if (!chapterIds.has(chapterId)) errors.push(`Reference map points to missing chapter: ${chapterId}`);
  if (!Array.isArray(sourceIds) || !sourceIds.length) errors.push(`Reference map ${chapterId}: source list is empty`);
  for (const sourceId of sourceIds) {
    if (!sources[sourceId]) errors.push(`Reference map ${chapterId}: unknown source ${sourceId}`);
  }
}

const notice = fs.readFileSync("NOTICE.md", "utf8");
if (!/three\.js/i.test(notice) || !/MIT/i.test(notice)) errors.push("NOTICE.md must include the three.js MIT notice");

const readme = fs.readFileSync("README.md", "utf8");
for (const marker of ["LICENSE-CODE", "LICENSE-CONTENT", "docs/SOURCES.md", "docs/LICENSING.md"]) {
  if (!readme.includes(marker)) errors.push(`README.md must link or mention ${marker}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Licensing OK: ${Object.keys(sources).length} sources, ${Object.keys(chapterReferences).length} chapter reference maps`);
