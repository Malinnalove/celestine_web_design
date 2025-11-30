"use client";

import { useTransition } from "react";
import type { ActionState } from "@/lib/actionState";

type EditModeBadgeProps = {
  onDisable: () => Promise<ActionState>;
};

export default function EditModeBadge({ onDisable }: EditModeBadgeProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-ink text-sand px-5 py-3 text-xs uppercase tracking-[0.4em] shadow-soft">
      <span>Edit mode active</span>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            void onDisable();
          })
        }
        disabled={isPending}
        className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
      >
        Exit
      </button>
    </div>
  );
}
