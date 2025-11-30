"use client";

import { useTransition } from "react";
import type { ActionState } from "@/lib/actionState";
import { addMilestoneAction, deleteMilestoneAction } from "@/lib/actions";

type Props = {
  milestoneId?: string;
};

export function AddMilestoneButton({ afterId }: { afterId?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await addMilestoneAction(afterId); })}
      className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink transition hover:border-ink hover:bg-ink hover:text-sand disabled:opacity-60"
    >
      Add milestone
    </button>
  );
}

export function DeleteMilestoneButton({ milestoneId }: Props) {
  const [pending, startTransition] = useTransition();
  if (!milestoneId) return null;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await deleteMilestoneAction(milestoneId); })}
      className="rounded-full border border-rose-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
    >
      Remove
    </button>
  );
}
