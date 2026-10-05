import { chapters as c1 } from "../../../content/chapters/01-foundation.js";
import { chapters as c2 } from "../../../content/chapters/02-system-os.js";
import { chapters as c3a } from "../../../content/chapters/03-parallel-models.js";
import { chapters as c3b } from "../../../content/chapters/03-network-storage.js";
import { chapters as c3c } from "../../../content/chapters/03-toolchain-slurm.js";
import { enhancements as q3a } from "../../../content/enrichments/03-parallel-models.js";
import { enhancements as q3b } from "../../../content/enrichments/03-network-storage.js";
import { enhancements as q3c } from "../../../content/enrichments/03-toolchain-slurm.js";
import { chapters as c4 } from "../../../content/chapters/04-performance.js";
import { enhancements as q4 } from "../../../content/enrichments/04-performance.js";
import { chapters as c5 } from "../../../content/chapters/05-accelerator.js";
import { chapters as c6a } from "../../../content/chapters/06-slurm-rca.js";
import { chapters as c6b } from "../../../content/chapters/06-monitoring-ops.js";
import { chapters as c6c } from "../../../content/chapters/06-runbooks.js";
import { chapters as c7 } from "../../../content/chapters/07-expert-practice.js";

const quality3 = Object.freeze({ ...q3a, ...q3b, ...q3c });
const enrich = (list, quality) => list.map(chapter => quality[chapter.id] ? { ...chapter, ...quality[chapter.id] } : chapter);

export const chapters = [
  ...c1, ...c2,
  ...enrich(c3a, quality3), ...enrich(c3b, quality3), ...enrich(c3c, quality3),
  ...enrich(c4, q4), ...c5,
  ...c6a, ...c6b, ...c6c,
  ...c7
];

export const stageOrder = [
  "Foundation",
  "System / OS",
  "Parallel / Cluster",
  "Performance",
  "Accelerator",
  "Operations / RCA",
  "Expert Practice"
];

export const stageLabels = {
  "Foundation": "기초",
  "System / OS": "시스템 / OS",
  "Parallel / Cluster": "병렬 / 클러스터",
  "Performance": "성능",
  "Accelerator": "가속기",
  "Operations / RCA": "운영 / RCA",
  "Expert Practice": "실무 심화"
};
