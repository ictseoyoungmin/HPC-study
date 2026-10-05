import { readFile } from "node:fs/promises";

const css = await readFile("assets/css/app.css", "utf8");
const refs = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/gi)].map(match => match[1]));
const defs = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(match => match[1]));
const missing = [...refs].filter(token => !defs.has(token));

const required = [
  "--paper","--ink","--muted","--rule","--accent","--accent-2",
  "--rail","--rail-ink","--viewer","--viewer-side","--viewer-node",
  "--viewer-line","--viewer-text","--viewer-muted","--viz-accent-bg"
];
const dark = css.match(/html\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)?.[1] || "";
const darkDefs = new Set([...dark.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map(match => match[1]));
for (const token of required) if (!darkDefs.has(token)) missing.push(`${token} (dark override)`);

if (missing.length) {
  console.error(`Theme token validation failed:\n${[...new Set(missing)].join("\n")}`);
  process.exit(1);
}
console.log(`Theme OK: ${refs.size} referenced tokens resolved; dark semantic palette complete`);
