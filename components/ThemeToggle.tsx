"use client";

import { useTransition } from "react";
import { setThemeAction } from "@/lib/actions";

type ThemeToggleProps = {
  initialTheme: "classic" | "beast";
};

export default function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [pending, startTransition] = useTransition();
  const current = initialTheme;

  const handleToggle = (theme: "classic" | "beast") => {
    if (theme === current) return;
    startTransition(async () => {
      await setThemeAction(theme);
    });
  };

  const baseButton =
    "rounded-full px-3 py-1 text-[11px] font-semibold leading-none transition opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0";

  return (
    <div
      className="group absolute left-1/2 top-[-6px] flex -translate-x-1/2 transform items-center gap-2 rounded-full border border-transparent bg-transparent px-2 py-[2px] text-[11px] uppercase tracking-[0.3em] text-ink/60 transition-all duration-300 opacity-0 hover:opacity-100 focus-within:opacity-100"
      title="Theme"
    >
      <button
        type="button"
        onClick={() => handleToggle("classic")}
        disabled={pending}
        className={`${baseButton} ${
          current === "classic"
            ? "bg-ink text-sand shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
            : "bg-transparent text-ink/70 hover:bg-ink/5 dark:text-[#e1d7d7]/70 dark:hover:bg-[#ff6501]/15"
        }`}
      >
        Classic
      </button>
      <button
        type="button"
        onClick={() => handleToggle("beast")}
        disabled={pending}
        className={`${baseButton} ${
          current === "beast"
            ? "bg-ink text-sand shadow-[0_10px_24px_rgba(0,0,0,0.12)] dark:bg-[#ff6501] dark:text-[#2d2834]"
            : "bg-transparent text-ink/70 hover:bg-ink/5 dark:text-[#e1d7d7]/70 dark:hover:bg-[#ff6501]/15"
        }`}
      >
        Beast
      </button>
    </div>
  );
}
