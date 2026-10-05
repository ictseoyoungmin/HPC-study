import { chapters, stageOrder } from "../assets/js/content/index.js";
import { visualizationIds } from "../assets/js/visualizations/index.js";

const required = ["id","stage","title","en","level","minutes","env","why","concepts","commands","lab","mistakes","troubleshoot","keywords"];
const errors = [];
const ids = new Set();

if (chapters.length !== 62) errors.push(`Expected 62 chapters, found ${chapters.length}`);

chapters.forEach((chapter, index) => {
  const at = `chapter[${index}] ${chapter.id || "<no id>"}`;
  for (const key of required) if (!(key in chapter)) errors.push(`${at}: missing ${key}`);
  if (!chapter.id || !/^[a-z0-9-]+$/.test(chapter.id)) errors.push(`${at}: invalid id`);
  if (ids.has(chapter.id)) errors.push(`${at}: duplicate id`);
  ids.add(chapter.id);
  if (!stageOrder.includes(chapter.stage)) errors.push(`${at}: unknown stage ${chapter.stage}`);
  if (!Number.isFinite(chapter.minutes) || chapter.minutes <= 0) errors.push(`${at}: minutes must be > 0`);
  for (const key of ["env","concepts","commands","mistakes","keywords"]) {
    if (!Array.isArray(chapter[key])) errors.push(`${at}: ${key} must be an array`);
  }
  if (!chapter.why?.trim()) errors.push(`${at}: empty why`);
  if (!chapter.concepts?.length) errors.push(`${at}: concepts must not be empty`);
  if (chapter.lab && (!chapter.lab.title || !Array.isArray(chapter.lab.steps) || !chapter.lab.expect)) {
    errors.push(`${at}: invalid lab schema`);
  }
});

for (const id of visualizationIds) {
  if (!ids.has(id)) errors.push(`Visualization points to missing chapter: ${id}`);
}

for (const id of ["cluster-architecture","cpu-topology","numa","mpi-basics","slurm-basics","scaling","strong-weak"]) {
  if (!visualizationIds.includes(id)) errors.push(`Required teaching visualization missing: ${id}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Content OK: ${chapters.length} chapters, ${visualizationIds.length} visualization routes`);
