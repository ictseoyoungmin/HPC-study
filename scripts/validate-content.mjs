import { chapters, stageOrder } from "../assets/js/core/curriculum.js";
import { visualizationIds } from "../assets/js/visualizations/index.js";

const required = ["id","stage","title","en","level","minutes","env","why","concepts","commands","lab","mistakes","troubleshoot","keywords"];
const qualityRequired = ["learningObjectives","terms","sections","selfCheck"];
const qualityStages = new Set(["Foundation", "System / OS"]);
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

  if (qualityStages.has(chapter.stage)) {
    for (const key of qualityRequired) {
      if (!Array.isArray(chapter[key]) || !chapter[key].length) errors.push(`${at}: quality pass requires ${key}`);
    }
    if ((chapter.learningObjectives || []).length < 3) errors.push(`${at}: requires at least 3 learning objectives`);
    if ((chapter.terms || []).length < 5) errors.push(`${at}: requires at least 5 defined terms`);
    if ((chapter.sections || []).length < 3) errors.push(`${at}: requires at least 3 explanatory sections`);
    if ((chapter.selfCheck || []).length < 3) errors.push(`${at}: requires at least 3 self-check questions`);
    for (const [i, term] of (chapter.terms || []).entries()) {
      if (!term.term || !term.definition || !term.why) errors.push(`${at}: term[${i}] must include term/definition/why`);
    }
    for (const [i, section] of (chapter.sections || []).entries()) {
      if (!section.title || !Array.isArray(section.paragraphs) || section.paragraphs.length < 2 || !section.takeaway) {
        errors.push(`${at}: section[${i}] must include title, 2+ paragraphs, takeaway`);
      }
    }
    for (const [i, check] of (chapter.selfCheck || []).entries()) {
      if (!check.question || !check.answer) errors.push(`${at}: selfCheck[${i}] must include question/answer`);
    }
  }
});

for (const id of visualizationIds) {
  if (!ids.has(id)) errors.push(`Visualization points to missing chapter: ${id}`);
}

for (const id of ["hpc-aa-role","cluster-architecture","process-signals","os-control","cpu-topology","cache-coherence","virtual-memory","numa","mpi-basics","network-basics","rdma-interconnect","network-benchmark","storage-stack","parallel-filesystems","scientific-io","slurm-basics","scaling","strong-weak","gpu-basics","gpu-memory","multi-gpu"]) {
  if (!visualizationIds.includes(id)) errors.push(`Required teaching visualization missing: ${id}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Content OK: ${chapters.length} chapters, ${visualizationIds.length} visualization routes`);
