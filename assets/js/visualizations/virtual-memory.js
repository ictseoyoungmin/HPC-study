import { css, label, box, line, arrow, particle, createLoop, viewerShell, setDetails, activateButton } from "./canvas-utils.js";

const details = {
  translate: {
    title: "Virtual → physical translation",
    body: "프로세스는 연속적인 virtual address space를 보지만 실제 physical frame은 흩어져 있을 수 있다. page table이 virtual page를 physical frame에 매핑한다.",
    rows: [["VmSize", "예약된 virtual address space 크기와 관련"], ["RSS", "현재 resident한 physical memory 양과 관련"]],
    note: "Virtual memory 크기만으로 실제 DRAM 사용량을 판단하지 않는다."
  },
  minor: {
    title: "Minor page fault",
    body: "필요한 page가 이미 memory에 있지만 현재 process의 page table mapping이 아직 준비되지 않은 경우처럼 storage I/O 없이 처리되는 fault다.",
    rows: [["비용", "major fault보다 작지만 매우 빈번하면 CPU overhead가 될 수 있음"], ["예", "copy-on-write, 이미 cache된 file page mapping 등"]],
    note: "fault라는 이름이 항상 disk access를 뜻하지 않는다."
  },
  major: {
    title: "Major page fault",
    body: "필요한 page가 memory에 없어 backing storage에서 읽어와야 하는 fault다. storage latency가 개입하므로 응답 시간이 크게 늘 수 있다.",
    rows: [["경로", "storage → page cache/frame → page table → process"], ["관찰", "major fault와 I/O wait, storage latency를 같은 시간축에서 확인"]],
    note: "major fault가 많다는 사실만으로 storage 장애를 확정하지 말고 workload의 접근 패턴과 함께 본다."
  },
  pressure: {
    title: "Memory pressure · reclaim · OOM",
    body: "available memory가 줄면 kernel은 page cache reclaim이나 swap을 시도할 수 있다. reclaim으로도 요구를 충족하지 못하면 cgroup 또는 system OOM이 발생할 수 있다.",
    rows: [["판단", "free가 아니라 available, reclaim, swap in/out을 함께 봄"], ["OOM", "job request/limit와 MaxRSS, kernel/cgroup log를 함께 비교"]],
    note: "cache는 회수 가능한 memory일 수 있으므로 사용 중이라는 이유만으로 leak로 보지 않는다."
  }
};

export function mountVirtualMemory(host) {
  const { canvas, controls } = viewerShell(host, "Virtual memory · Page fault · OOM",
    `<button class="viz-btn active" data-mode="translate">Translate</button>
     <button class="viz-btn" data-mode="minor">Minor fault</button>
     <button class="viz-btn" data-mode="major">Major fault</button>
     <button class="viz-btn" data-mode="pressure">Pressure / OOM</button>`, details.translate);
  let mode = "translate";
  const click = event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    mode = button.dataset.mode;
    activateButton(controls, "[data-mode]", mode);
    setDetails(host, details[mode]);
  };
  controls.addEventListener("click", click);

  const stop = createLoop(canvas, (ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    if (mode === "pressure") {
      const labels = [["Active app", .12], ["Page cache", .31], ["Available", .50], ["Swap", .69], ["OOM boundary", .87]];
      labels.forEach(([name, py], i) => box(ctx, w / 2 - 120, h * py - 24, 240, 48, name, { accent: i === 0 || (i === 4 && Math.sin(t * 3) > 0) }));
      arrow(ctx, w / 2, h * .55, w / 2, h * .66, css("--warning"), 2);
      arrow(ctx, w / 2, h * .74, w / 2, h * .82, css("--warning"), 2);
      label(ctx, "reclaim / swap으로 압력을 흡수하지 못하면 OOM", w / 2, h - 18, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
      return;
    }

    const colW = Math.min(150, (w - 86) / 3);
    const gap = (w - colW * 3) / 4;
    const xV = gap, xP = gap * 2 + colW, xF = gap * 3 + colW * 2;
    const y = 56;
    box(ctx, xV, y, colW, 54, "Virtual pages", { accent: true });
    box(ctx, xP, y, colW, 54, "Page table", {});
    box(ctx, xF, y, colW, 54, "Physical frames", {});
    arrow(ctx, xV + colW, y + 27, xP, y + 27, css("--accent"), 2);
    arrow(ctx, xP + colW, y + 27, xF, y + 27, css("--accent"), 2);

    const pages = [0, 1, 2, 3];
    pages.forEach((n, i) => {
      const yy = 144 + i * 54;
      box(ctx, xV + 16, yy, colW - 32, 38, `VPN ${n}`, { accent: i === 2 && mode !== "translate", size: 12 });
      box(ctx, xF + 16, yy, colW - 32, 38, `PFN ${[5, 1, 7, 3][i]}`, { accent: mode === "translate" && i === 1, size: 12 });
      line(ctx, xV + colW - 16, yy + 19, xF + 16, yy + 19, css("--viewer-line"), 1, true);
    });

    if (mode === "minor") {
      box(ctx, xP + 8, 246, colW - 16, 44, "mapping missing", { accent: true, size: 11 });
      arrow(ctx, xF + colW / 2, 263, xP + colW / 2, 263, css("--accent-2"), 2);
      label(ctx, "page는 RAM에 있음 → mapping만 준비", w / 2, h - 28, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
    } else if (mode === "major") {
      box(ctx, w / 2 - 95, h - 82, 190, 44, "Backing storage", { accent: true });
      arrow(ctx, w / 2 + 95, h - 60, xF + colW / 2, 326, css("--warning"), 2);
      particle(ctx, { x: w / 2 + 85, y: h - 60 }, { x: xF + colW / 2, y: 326 }, (t * .55) % 1, css("--warning"));
      label(ctx, "storage I/O가 개입", w / 2, h - 18, { size: 12, color: css("--viewer-muted") });
    } else {
      label(ctx, "주소 공간은 연속적으로 보여도 physical frame은 연속일 필요가 없다.", w / 2, h - 25, { size: 12, color: css("--viewer-muted"), maxWidth: w - 30 });
    }
  });

  return () => { stop(); controls.removeEventListener("click", click); };
}
