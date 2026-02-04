"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "habit-copilot-theme";

function getSystemTheme(): Exclude<Theme, "system"> {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const resolved: Exclude<Theme, "system"> = theme === "system" ? getSystemTheme() : theme;

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) as
      | Theme
      | null;
    const initial: Theme = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  const resolved = useMemo(() => (theme === "system" ? getSystemTheme() : theme), [theme]);

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        aria-label="Toggle theme"
      >
        {resolved === "dark" ? "Light mode" : "Dark mode"}
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className="rounded-xl px-2 py-2 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-label="Use system theme"
        title="Use system theme"
      >
        System
      </button>
    </div>
  );
}
