const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[ch]));

const languageLabels = Object.freeze({
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  c: "C",
  cpp: "C++",
  python: "Python",
  slurm: "Slurm / Bash",
  text: "Text",
  output: "Output"
});

const kindLabels = Object.freeze({
  command: "명령",
  script: "스크립트",
  source: "소스 코드",
  output: "출력",
  config: "설정"
});

export function codeBlockHtml({
  title = "",
  language = "text",
  kind = "source",
  filename = "",
  code = "",
  description = "",
  observe = "",
  caution = ""
} = {}) {
  const languageKey = String(language || "text").toLowerCase();
  const languageLabel = languageLabels[languageKey] || language;
  const kindLabel = kindLabels[kind] || kind;
  const meta = [languageLabel, kindLabel, filename].filter(Boolean).join(" · ");

  return `
    <article class="code-block" data-language="${escapeHtml(languageKey)}" data-kind="${escapeHtml(kind)}">
      <header class="code-block-head">
        <div class="code-block-heading">
          ${title ? `<strong>${escapeHtml(title)}</strong>` : ""}
          <span>${escapeHtml(meta)}</span>
        </div>
        <button class="code-copy-btn" type="button" data-code-copy>Copy</button>
      </header>
      ${description ? `<div class="code-block-description">${escapeHtml(description)}</div>` : ""}
      <pre class="code-block-pre"><code class="language-${escapeHtml(languageKey)}">${escapeHtml(code)}</code></pre>
      ${(observe || caution) ? `
        <div class="code-block-note">
          ${observe ? `<p><b>관찰</b><span>${escapeHtml(observe)}</span></p>` : ""}
          ${caution ? `<p class="code-caution"><b>주의</b><span>${escapeHtml(caution)}</span></p>` : ""}
        </div>` : ""}
    </article>`;
}

export function bindCodeBlocks(root = document) {
  root.querySelectorAll("[data-code-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const block = button.closest(".code-block");
      const code = block?.querySelector("code")?.textContent || "";
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        setTimeout(() => { button.textContent = "Copy"; }, 900);
      } catch {
        button.textContent = "Copy failed";
        setTimeout(() => { button.textContent = "Copy"; }, 1200);
      }
    });
  });
}

const shellCommandStart = /^(?:#!|\$\s*|#\s*(?:SBATCH|!\/)|(?:sudo\s+)?(?:awk|bash|cat|cd|chmod|chown|cmake|command|cp|curl|cut|date|df|diff|dmesg|du|echo|env|export|false|find|free|gcc|g\+\+|grep|head|hostname|id|ip|journalctl|kill|ldd|less|ls|lsblk|lscpu|make|mkdir|module|mpirun|numactl|nvidia-smi|perf|printf|ps|python|python3|readelf|rsync|sacct|sbatch|scontrol|sed|sinfo|sort|sprio|squeue|srun|ssh|ss|stat|tail|tar|taskset|time|top|touch|type|ulimit|uniq|uptime|vmstat|wc|which)\b)/i;

export function looksLikeShellCode(value) {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;
  if (text.includes("\n")) return true;
  if (shellCommandStart.test(text)) return true;
  return /(?:\|\||&&|\|\s*[a-z]|(?:^|\s)(?:1?>|2>|2>&1)\s*\S|\$[A-Za-z_{])/.test(text);
}
