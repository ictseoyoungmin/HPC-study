import { chapters, stageOrder } from "../assets/js/core/curriculum.js";
import { commandEvidence, commandEvidenceChapterIds } from "../content/command-evidence.js";

const errors=[];
const chapterById=new Map(chapters.map(chapter=>[chapter.id,chapter]));
const stages=new Set();

if(commandEvidenceChapterIds.length<15){
  errors.push(`Expected at least 15 command-evidence chapters, found ${commandEvidenceChapterIds.length}`);
}

for(const chapterId of commandEvidenceChapterIds){
  const chapter=chapterById.get(chapterId);
  if(!chapter){
    errors.push(`Command evidence points to missing chapter: ${chapterId}`);
    continue;
  }
  stages.add(chapter.stage);
  const items=commandEvidence[chapterId];
  if(!Array.isArray(items)||!items.length){
    errors.push(`${chapterId}: evidence must be a non-empty array`);
    continue;
  }
  items.forEach((item,index)=>{
    const at=`${chapterId}[${index}]`;
    for(const key of ["title","command","output"]){
      if(!item[key]?.trim()) errors.push(`${at}: missing ${key}`);
    }
    if(!Array.isArray(item.read)||item.read.length<2) errors.push(`${at}: requires 2+ read points`);
    if(!Array.isArray(item.branches)||item.branches.length<2) errors.push(`${at}: requires 2+ diagnostic branches`);
    for(const [i,point] of (item.read||[]).entries()){
      if(!point.field?.trim()||!point.meaning?.trim()) errors.push(`${at}: read[${i}] requires field/meaning`);
    }
    for(const [i,branch] of (item.branches||[]).entries()){
      if(!branch.when?.trim()||!branch.next?.trim()) errors.push(`${at}: branches[${i}] requires when/next`);
    }
  });
}

for(const stage of stageOrder){
  if(!stages.has(stage)) errors.push(`Command evidence has no representative chapter in stage: ${stage}`);
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Command evidence OK: ${commandEvidenceChapterIds.length} chapters across ${stages.size} stages`);
