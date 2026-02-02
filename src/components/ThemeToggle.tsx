"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by waiting until mounted
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group flex items-center justify-center w-9 h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-200 active:scale-95 shadow-sm"
      aria-label="Temayı Değiştir"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
      )}
    </button>
  );
}
