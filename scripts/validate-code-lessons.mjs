import { chapters } from "../assets/js/core/curriculum.js";
import { chapterCodeLessons } from "../content/code-lessons.js";

const chapterIds = new Set(chapters.map(chapter => chapter.id));
const supportedLanguages = new Set(["bash", "sh", "shell", "c", "cpp", "python", "slurm", "text", "output"]);
const supportedKinds = new Set(["command", "script", "source", "output", "config"]);
const sampleIds = new Set();
const errors = [];

for (const [chapterId, lesson] of Object.entries(chapterCodeLessons)) {
  if (!chapterIds.has(chapterId)) errors.push(`Code lesson points to missing chapter: ${chapterId}`);
  if (!String(lesson.title || "").trim()) errors.push(`${chapterId}: missing lesson title`);
  if (!String(lesson.intro || "").trim()) errors.push(`${chapterId}: missing lesson intro`);
  if (!Array.isArray(lesson.samples) || !lesson.samples.length) errors.push(`${chapterId}: samples must not be empty`);

  for (const [index, sample] of (lesson.samples || []).entries()) {
    const at = `${chapterId}.samples[${index}]`;
    if (!sample.id) errors.push(`${at}: missing id`);
    else if (sampleIds.has(sample.id)) errors.push(`${at}: duplicate sample id ${sample.id}`);
    else sampleIds.add(sample.id);
    if (!String(sample.title || "").trim()) errors.push(`${at}: missing title`);
    if (!supportedLanguages.has(sample.language)) errors.push(`${at}: unsupported language ${sample.language}`);
    if (!supportedKinds.has(sample.kind)) errors.push(`${at}: unsupported kind ${sample.kind}`);
    if (!String(sample.code || "").trim()) errors.push(`${at}: empty code`);
    if (sample.kind === "script" && ["bash", "sh", "shell"].includes(sample.language) && !sample.code.startsWith("#!")) {
      errors.push(`${at}: shell script should start with a shebang`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Code lessons OK: ${Object.keys(chapterCodeLessons).length} chapters, ${sampleIds.size} samples`);
