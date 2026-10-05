import { chapters, stageOrder, stageLabels } from "./core/curriculum.js";
import { initTheme } from "./core/theme.js";
import { state, setLast, isCompleted, toggleCompleted, completedCount } from "./core/state.js";
import { hasVisualization, mountVisualization } from "./visualizations/index.js";
import { sourcesForChapter } from "../../content/sources.js";

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

function groupedFilteredChapters() {
  const q = searchQuery.trim().toLowerCase();
  const map = new Map(stageOrder.map(stage => [stage, []]));
  chapters.forEach(ch => {
    const hay = [ch.title,ch.en,ch.why,...(ch.keywords||[])].join(" ").toLowerCase();
    if (!q || hay.includes(q)) map.get(ch.stage)?.push(ch);
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
          <input id="search" type="search" placeholder="챕터 검색" autocomplete="off">
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

function conceptsHtml(chapter) {
  return `
    <div class="concept-list">
      ${(chapter.concepts||[]).map((text,i) => `
        <div class="concept-row">
          <span>${String(i+1).padStart(2,"0")}</span>
          <p>${esc(text)}</p>
        </div>`).join("")}
    </div>`;
}

function commandsHtml(chapter) {
  if (!(chapter.commands||[]).length) return "";
  return `
    <section class="lesson">
      <h2>Linux에서 확인</h2>
      <p class="section-intro">명령의 목적과 관찰할 값을 함께 읽는다. 사이트 정책이나 권한에 따라 일부 명령은 제한될 수 있다.</p>
      <div class="command-list">
        ${chapter.commands.map(cmd => `
          <article class="command">
            <div class="command-head">
              <strong>${esc(cmd.purpose)}</strong>
              <button class="copy-btn" data-copy="${esc(cmd.cmd)}">Copy</button>
            </div>
            <pre><code>${esc(cmd.cmd)}</code></pre>
            <div class="command-note"><b>관찰:</b> ${esc(cmd.observe || "")}${cmd.caution ? `<br><b>주의:</b> ${esc(cmd.caution)}` : ""}</div>
          </article>`).join("")}
      </div>
    </section>`;
}

function labHtml(chapter) {
  if (!chapter.lab) return "";
  const steps = chapter.lab.steps || [];
  return `
    <section class="lesson">
      <h2>실습 · ${esc(chapter.lab.title)}</h2>
      <ol class="lab-steps">${steps.map(step=>`<li><code>${esc(step)}</code></li>`).join("")}</ol>
      <div class="callout"><b>완료 기준</b><p>${esc(chapter.lab.expect || "")}</p></div>
    </section>`;
}

function mistakesHtml(chapter) {
  return `
    <section class="lesson split">
      <div>
        <h2>흔한 실수</h2>
        <ul class="plain-list">${(chapter.mistakes||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <div>
        <h2>Troubleshooting 관점</h2>
        <p>${esc(chapter.troubleshoot || "")}</p>
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

    <section class="lesson">
      <h2>핵심 개념</h2>
      ${conceptsHtml(chapter)}
    </section>

    ${hasVisualization(chapter.id) ? `<section class="lesson visual-lesson"><h2>개념 시각화</h2><div id="visualization"></div></section>` : ""}

    ${commandsHtml(chapter)}
    ${labHtml(chapter)}
    ${mistakesHtml(chapter)}
    ${referencesHtml(chapter)}

    <footer class="pager">
      ${prev ? `<button class="pager-btn" data-chapter="${esc(prev.id)}"><small>이전</small><span>${esc(prev.title)}</span></button>` : `<span></span>`}
      <button id="complete-btn" class="complete-btn ${isCompleted(chapter.id)?"done":""}" type="button">${isCompleted(chapter.id)?"완료됨":"학습 완료"}</button>
      ${next ? `<button class="pager-btn next" data-chapter="${esc(next.id)}"><small>다음</small><span>${esc(next.title)}</span></button>` : `<span></span>`}
    </footer>`;

  page.querySelectorAll("[data-chapter]").forEach(btn=>btn.addEventListener("click",()=>go(btn.dataset.chapter)));
  page.querySelectorAll("[data-copy]").forEach(btn=>btn.addEventListener("click",async()=>{
    const text=btn.dataset.copy;
    try { await navigator.clipboard.writeText(text); btn.textContent="Copied"; setTimeout(()=>btn.textContent="Copy",900); }
    catch {}
  }));

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
  if (e.target.matches("input,textarea,select")) return;
  const i=chapterIndex(routeId());
  if (e.key==="ArrowLeft" || e.key==="PageUp") { if (chapters[i-1]) go(chapters[i-1].id); }
  if (e.key==="ArrowRight" || e.key==="PageDown") { if (chapters[i+1]) go(chapters[i+1].id); }
});
if (!location.hash) history.replaceState(null,"",`#/chapter/${routeId()}`);
onRoute();
