"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const dark = (theme === "system" ? resolvedTheme : theme) === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="rounded-lg p-2 hover:bg-muted min-h-11 min-w-11 inline-flex items-center justify-center"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Sun className="size-4 hidden dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
