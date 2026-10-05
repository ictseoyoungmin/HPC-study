import { sourcesForChapter } from "./content/sources.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>\"]/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  }[ch]));
}

function currentChapterId() {
  return location.hash.match(/^#\/chapter\/([^/]+)/)?.[1] || "";
}

function renderReferences() {
  const page = document.querySelector("#page");
  if (!page) return;
  page.querySelector("[data-reference-section]")?.remove();

  const refs = sourcesForChapter(currentChapterId());
  if (!refs.length) return;

  const section = document.createElement("section");
  section.className = "lesson references";
  section.dataset.referenceSection = "true";
  section.innerHTML = `
    <h2>References</h2>
    <p class="section-intro">아래 문서는 기술적 사실과 동작을 확인하기 위한 reference다. HPC Study의 설명과 도식은 별도로 작성한다.</p>
    <ul class="plain-list">
      ${refs.map(source => `
        <li>
          <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>
          <span> · ${esc(source.publisher)} · ${esc(source.usage)}</span>
        </li>`).join("")}
    </ul>`;

  const pager = page.querySelector(".pager");
  if (pager) pager.before(section);
  else page.append(section);
}

function schedule() {
  requestAnimationFrame(renderReferences);
}

window.addEventListener("hashchange", schedule);
window.addEventListener("DOMContentLoaded", schedule);
schedule();
