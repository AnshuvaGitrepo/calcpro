import { useState, useEffect } from "react";

// ids stay "dark" / "light" / "ocean" so saved preferences from older versions keep working
export const THEMES = [
  { id: "dark",  label: "Graphite", bg: "#17191c", accent: "#f5a524" },
  { id: "light", label: "Paper",    bg: "#eceae5", accent: "#1f5bd6" },
  { id: "ocean", label: "Ocean",    bg: "#0b1724", accent: "#34d1bf" },
];

// localStorage can throw (private mode, blocked site data); never let that break the app
export function readPref(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
export function writePref(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = readPref("calc-theme", "dark");
    return THEMES.some((t) => t.id === saved) ? saved : "dark";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writePref("calc-theme", theme);
    // status bar / browser chrome follows the page background
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEMES.find((t) => t.id === theme).bg);
  }, [theme]);
  return [theme, setTheme];
}
