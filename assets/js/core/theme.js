import { readTheme, writeTheme } from "./state.js";

export function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  const button = document.querySelector("#theme-toggle");
  if (button) {
    button.textContent = next === "dark" ? "Light" : "Dark";
    button.title = next === "dark" ? "Light 테마로 전환" : "Dark 테마로 전환";
    button.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
  }
}

export function initTheme() {
  applyTheme(readTheme());
  const button = document.querySelector("#theme-toggle");
  if (!button) return;
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    writeTheme(next);
    applyTheme(next);
  });
}
