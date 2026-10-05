import { chapters, stageOrder, stageLabels } from "./core/curriculum.js";
import { initTheme } from "./core/theme.js";
import { state, setLast, isCompleted, toggleCompleted } from "./core/state.js";
import { hasVisualization, mountVisualization } from "./visualizations/index.js";
import { codeBlockHtml, bindCodeBlocks, looksLikeShellCode } from "./ui/code-block.js";
import { sourcesForChapter } from "../../content/sources.js";
import { codeLessonForChapter } from "../../content/code-lessons.js";

const app = document.querySelector("#app");
let cleanupVisualization = null;
let searchQuery = "";

const esc = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
}[ch]));

function routeId() {
  const match = location.hash.match(/^#\/chapter\/([^/]+)/);
  return match?.[1] || state.last || chapters[0].id;
}

function go(id) {
  location.hash = `#/chapter/${id}`;
}

function chapterIndex(id) {
  return Math.max(0, chapters.findIndex(ch => ch.id === id));
}

function searchText(chapter) {
  const terms = (chapter.terms || []).flatMap(term => [term.term, term.en, term.definition, term.why]);
  const sections = (chapter.sections || []).flatMap(section => [section.title, ...(section.paragraphs || []), section.takeaway]);
  const objectives = chapter.learningObjectives || [];
  const codeLesson = codeLessonForChapter(chapter.id);
  const codeText = codeLesson ? [
    codeLesson.title,
    codeLesson.intro,
    ...(codeLesson.principles || []).flatMap(item => [item.title, item.text]),
    ...(codeLesson.samples || []).flatMap(sample => [sample.title, sample.filename, sample.description, sample.code])
  ] : [];
  return [chapter.title, chapter.en, chapter.why, ...(chapter.keywords || []), ...terms, ...sections, ...objectives, ...codeText].join(" ").toLowerCase();
}

function groupedFilteredChapters() {
  const q = searchQuery.trim().toLowerCase();
  const map = new Map(stageOrder.map(stage => [stage, []]));
  chapters.forEach(ch => {
    if (!q || searchText(ch).includes(q)) map.get(ch.stage)?.push(ch);
  });
  return map;
}

function renderShell() {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="rail">
        <div class="brand">
          <strong>HPC Study</strong>
          <span>Application Analyst 학습 교재</span>
        </div>
        <div class="search-wrap">
          <input id="search" type="search" placeholder="챕터·용어 검색" autocomplete="off">
        </div>
        <nav id="chapter-nav" class="chapter-nav"></nav>
      </aside>

      <main class="main" id="main">
        <header class="topbar">
          <div id="crumb" class="crumb"></div>
          <div class="top-actions">
            <button id="theme-toggle" class="theme-toggle" type="button">Dark</button>
            <div class="progress-wrap"><span id="page-count"></span><span class="progress-track"><i id="page-progress"></i></span></div>
          </div>
        </header>
        <article id="page" class="page"></article>
      </main>
    </div>`;

  const search = document.querySelector("#search");
  search.addEventListener("input", () => {
    searchQuery = search.value;
    renderNav(routeId());
  });
  initTheme();
}

function renderNav(activeId) {
  const nav = document.querySelector("#chapter-nav");
  const groups = groupedFilteredChapters();
  nav.innerHTML = stageOrder.map(stage => {
    const list = groups.get(stage) || [];
    if (!list.length) return "";
    return `
      <section class="nav-group">
        <h2>${esc(stageLabels[stage] || stage)}</h2>
        ${list.map(ch => {
          const i = chapterIndex(ch.id);
          return `<button class="nav-item ${ch.id===activeId?"active":""}" data-chapter="${esc(ch.id)}">
            <span class="nav-num">${String(i+1).padStart(2,"0")}</span>
            <span class="nav-copy">
              <strong>${esc(ch.title)}</strong>
              <small>${esc(ch.en)}</small>
            </span>
            <span class="done-dot ${isCompleted(ch.id)?"done":""}" aria-hidden="true"></span>
          </button>`;
        }).join("")}
      </section>`;
  }).join("");

  nav.querySelectorAll("[data-chapter]").forEach(btn => {
    btn.addEventListener("click", () => go(btn.dataset.chapter));
  });
}

function objectivesHtml(chapter) {
  if (!(chapter.learningObjectives || []).length) return "";
  return `
    <section class="lesson learning-objectives">
      <div class="lesson-kicker">이 장을 읽고 나면</div>
      <h2>학습 목표</h2>
      <ol>${chapter.learningObjectives.map(item => `<li>${esc(item)}</li>`).join("")}</ol>
    </section>`;
}

function termsHtml(chapter) {
  if (!(chapter.terms || []).length) return "";
  return `
    <section class="lesson terminology">
      <div class="lesson-kicker">먼저 언어를 맞춘다</div>
      <h2>핵심 용어</h2>
      <p class="section-intro">이 장에서 반복해서 사용할 용어를 먼저 정의한다. 영문 약어를 외우기보다 시스템에서 무엇을 가리키는지 연결해 읽는다.</p>
      <div class="term-grid">
        ${chapter.terms.map(term => `
          <article class="term-card">
            <div class="term-head"><strong>${esc(term.term)}</strong>${term.en ? `<span>${esc(term.en)}</span>` : ""}</div>
            <p>${esc(term.definition)}</p>
            ${term.why ? `<div class="term-why"><b>왜 중요한가</b><span>${esc(term.why)}</span></div>` : ""}
          </article>`).join("")}
      </div>
    </section>`;
}

function sectionsHtml(chapter) {
  if (!(chapter.sections || []).length) return "";
  return `
    <section class="lesson textbook-reading">
      <div class="lesson-kicker">개념을 문맥으로 이해한다</div>
      <h2>본문</h2>
      <div class="reading-stack">
        ${chapter.sections.map((section, index) => `
          <section class="reading-section">
            <div class="reading-index">${String(index + 1).padStart(2,"0")}</div>
            <div class="reading-copy">
              <h3>${esc(section.title)}</h3>
              ${(section.paragraphs || []).map(p => `<p>${esc(p)}</p>`).join("")}
              ${section.takeaway ? `<div class="takeaway"><b>핵심</b><span>${esc(section.takeaway)}</span></div>` : ""}
            </div>
          </section>`).join("")}
      </div>
    </section>`;
}

function conceptsHtml(chapter) {
  if (!(chapter.concepts || []).length) return "";
  return `
    <section class="lesson concept-summary-section">
      <div class="lesson-kicker">읽은 내용을 다시 압축한다</div>
      <h2>한 장으로 정리</h2>
      <div class="concept-summary">
        ${(chapter.concepts||[]).map((text,i) => `
          <div class="concept-summary-row">
            <span>${String(i+1).padStart(2,"0")}</span>
            <p>${esc(text)}</p>
          </div>`).join("")}
      </div>
    </section>`;
}

function exampleHtml(chapter) {
  if (!chapter.example) return "";
  const example = chapter.example;
  return `
    <section class="lesson worked-example">
      <div class="lesson-kicker">개념을 진단 흐름에 연결한다</div>
      <h2>${esc(example.title || "예제로 연결")}</h2>
      ${example.intro ? `<p class="section-intro">${esc(example.intro)}</p>` : ""}
      <div class="example-flow">
        ${(example.steps || []).map((step, index) => `
          <div class="example-step">
            <span class="example-num">${index + 1}</span>
            <div><strong>${esc(step.label)}</strong><p>${esc(step.text)}</p></div>
          </div>`).join("")}
      </div>
      ${example.conclusion ? `<div class="callout subtle"><b>정리</b><p>${esc(example.conclusion)}</p></div>` : ""}
    </section>`;
}

function codeLessonHtml(chapter) {
  const lesson = codeLessonForChapter(chapter.id);
  if (!lesson) return "";
  return `
    <section class="lesson code-lesson">
      <div class="lesson-kicker">명령에서 재사용 가능한 도구로 확장한다</div>
      <h2>${esc(lesson.title)}</h2>
      ${lesson.intro ? `<p class="section-intro code-lesson-intro">${esc(lesson.intro)}</p>` : ""}
      ${(lesson.principles || []).length ? `
        <div class="code-principles">
          ${lesson.principles.map(item => `<div class="code-principle"><strong>${esc(item.title)}</strong>${esc(item.text)}</div>`).join("")}
        </div>` : ""}
      <div class="code-sample-stack">
        ${(lesson.samples || []).map(sample => codeBlockHtml(sample)).join("")}
      </div>
    </section>`;
}

function commandsHtml(chapter) {
  if (!(chapter.commands||[]).length) return "";
  return `
    <section class="lesson">
      <div class="lesson-kicker">관찰 가능한 증거로 확인한다</div>
      <h2>Linux에서 확인</h2>
      <p class="section-intro">명령어 자체보다 무엇을 확인하기 위해 실행하는지와 어떤 출력이 가설을 지지하는지를 함께 읽는다. 사이트 정책이나 권한에 따라 일부 명령은 제한될 수 있다.</p>
      <div class="command-list">
        ${chapter.commands.map(cmd => codeBlockHtml({
          title: cmd.purpose,
          language: cmd.language || "bash",
          kind: "command",
          code: cmd.cmd,
          observe: cmd.observe || "",
          caution: cmd.caution || ""
        })).join("")}
      </div>
    </section>`;
}

function labStepHtml(step) {
  if (step && typeof step === "object") {
    if (step.code) {
      return codeBlockHtml({
        title: step.title || step.label || "실행",
        language: step.language || "bash",
        kind: step.kind || "command",
        filename: step.filename || "",
        code: step.code,
        description: step.description || "",
        observe: step.observe || "",
        caution: step.caution || ""
      });
    }
    return `<div class="lab-step-text">${esc(step.text || step.label || "")}</div>`;
  }
  if (looksLikeShellCode(step)) {
    return codeBlockHtml({ title: "실행", language: "bash", kind: "command", code: step });
  }
  return `<div class="lab-step-text">${esc(step)}</div>`;
}

function labHtml(chapter) {
  if (!chapter.lab) return "";
  const steps = chapter.lab.steps || [];
  return `
    <section class="lesson">
      <div class="lesson-kicker">직접 확인한다</div>
      <h2>실습 · ${esc(chapter.lab.title)}</h2>
      <ol class="lab-steps">${steps.map(step=>`<li class="lab-step">${labStepHtml(step)}</li>`).join("")}</ol>
      <div class="callout"><b>완료 기준</b><p>${esc(chapter.lab.expect || "")}</p></div>
    </section>`;
}

function mistakesHtml(chapter) {
  return `
    <section class="lesson split">
      <div>
        <div class="lesson-kicker">오판을 줄인다</div>
        <h2>흔한 실수</h2>
        <ul class="plain-list">${(chapter.mistakes||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <div>
        <div class="lesson-kicker">AA 관점으로 좁힌다</div>
        <h2>Troubleshooting 관점</h2>
        <p>${esc(chapter.troubleshoot || "")}</p>
      </div>
    </section>`;
}

function selfCheckHtml(chapter) {
  if (!(chapter.selfCheck || []).length) return "";
  return `
    <section class="lesson self-check">
      <div class="lesson-kicker">설명할 수 있는지 확인한다</div>
      <h2>Self-check</h2>
      <div class="self-check-list">
        ${chapter.selfCheck.map((item, index) => `
          <details>
            <summary><span>Q${index + 1}</span>${esc(item.question)}</summary>
            <p>${esc(item.answer)}</p>
          </details>`).join("")}
      </div>
    </section>`;
}

function referencesHtml(chapter) {
  const refs = sourcesForChapter(chapter.id);
  if (!refs.length) return "";
  return `
    <section class="lesson references">
      <h2>References</h2>
      <p class="section-intro">이 챕터의 기술적 사실과 용어를 확인할 때 사용한 주요 공식 자료다. 링크 표시는 원문·그림·코드의 재사용 허가를 의미하지 않는다.</p>
      <ul class="plain-list references-list">
        ${refs.map(ref => `<li><a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.title)}</a><span> · ${esc(ref.publisher)}</span></li>`).join("")}
      </ul>
    </section>`;
}

async function renderChapter(id) {
  const chapter = chapters.find(ch => ch.id === id) || chapters[0];
  const i = chapters.indexOf(chapter);
  setLast(chapter.id);

  if (cleanupVisualization) {
    try { cleanupVisualization(); } catch {}
    cleanupVisualization = null;
  }

  document.title = `${chapter.title} · HPC Study`;
  document.querySelector("#crumb").innerHTML = `<span>HPC</span><i>/</i><span>${esc(stageLabels[chapter.stage]||chapter.stage)}</span><i>/</i><strong>${esc(chapter.title)}</strong>`;
  document.querySelector("#page-count").textContent = `${String(i+1).padStart(2,"0")} / ${String(chapters.length).padStart(2,"0")}`;
  document.querySelector("#page-progress").style.width = `${((i+1)/chapters.length)*100}%`;

  const prev = chapters[i-1], next = chapters[i+1];
  const page = document.querySelector("#page");
  page.innerHTML = `
    <header class="chapter-header">
      <div class="chapter-number">CHAPTER ${String(i+1).padStart(2,"0")} · ${esc(chapter.en)}</div>
      <h1>${esc(chapter.title)}</h1>
      <p>${esc(chapter.why)}</p>
      <div class="chapter-meta">${esc(chapter.level)} · 약 ${chapter.minutes}분 · ${(chapter.env||[]).map(esc).join(" / ")}</div>
    </header>

    ${objectivesHtml(chapter)}
    ${termsHtml(chapter)}
    ${sectionsHtml(chapter)}
    ${conceptsHtml(chapter)}

    ${hasVisualization(chapter.id) ? `<section class="lesson visual-lesson"><div class="lesson-kicker">구조와 흐름으로 확인한다</div><h2>개념 시각화</h2><div id="visualization"></div></section>` : ""}

    ${exampleHtml(chapter)}
    ${codeLessonHtml(chapter)}
    ${commandsHtml(chapter)}
    ${labHtml(chapter)}
    ${mistakesHtml(chapter)}
    ${selfCheckHtml(chapter)}
    ${referencesHtml(chapter)}

    <footer class="pager">
      ${prev ? `<button class="pager-btn" data-chapter="${esc(prev.id)}"><small>이전</small><span>${esc(prev.title)}</span></button>` : `<span></span>`}
      <button id="complete-btn" class="complete-btn ${isCompleted(chapter.id)?"done":""}" type="button">${isCompleted(chapter.id)?"완료됨":"학습 완료"}</button>
      ${next ? `<button class="pager-btn next" data-chapter="${esc(next.id)}"><small>다음</small><span>${esc(next.title)}</span></button>` : `<span></span>`}
    </footer>`;

  page.querySelectorAll("[data-chapter]").forEach(btn=>btn.addEventListener("click",()=>go(btn.dataset.chapter)));
  bindCodeBlocks(page);

  page.querySelector("#complete-btn")?.addEventListener("click", e => {
    const done=toggleCompleted(chapter.id);
    e.currentTarget.classList.toggle("done",done);
    e.currentTarget.textContent=done?"완료됨":"학습 완료";
    renderNav(chapter.id);
  });

  renderNav(chapter.id);

  const host=document.querySelector("#visualization");
  if (host) cleanupVisualization = await mountVisualization(chapter.id, host);

  document.querySelector("#main").scrollTo({top:0,behavior:"instant"});
}

function onRoute() {
  renderChapter(routeId());
}

renderShell();
window.addEventListener("hashchange",onRoute);
document.addEventListener("keydown", e => {
  if (e.target.matches("input,textarea,select,button,summary")) return;
  const i=chapterIndex(routeId());
  if (e.key==="ArrowLeft" || e.key==="PageUp") { if (chapters[i-1]) go(chapters[i-1].id); }
  if (e.key==="ArrowRight" || e.key==="PageDown") { if (chapters[i+1]) go(chapters[i+1].id); }
});
if (!location.hash) history.replaceState(null,"",`#/chapter/${routeId()}`);
onRoute();