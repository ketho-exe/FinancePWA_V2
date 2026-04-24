"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const storageKey = "finance-theme";

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(storageKey);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const supportsMatchMedia = typeof window.matchMedia === "function";

  return supportsMatchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(storageKey, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors"
      onClick={() => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      style={{
        background: "var(--nav-item)",
        borderColor: "var(--panel-border)",
        color: "var(--fg)"
      }}
      type="button"
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
