"use client";

import { useFormState } from "react-dom";
import { actionInitialState, type ActionState } from "@/lib/actionState";

type EditModeLoginProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

export default function EditModeLogin({ action }: EditModeLoginProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    actionInitialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
          Edit mode access
        </p>
        <h3 className="font-heading text-2xl text-ink">Enter passphrase</h3>
        <p className="mt-2 text-sm text-ink/70">
          Authentication stays local to this browser for the next few hours.
        </p>
      </div>

      <input
        type="password"
        name="passcode"
        placeholder="Enter passphrase"
        className="w-full rounded-full border border-ink/20 px-5 py-3 text-sm uppercase tracking-[0.3em] text-ink outline-none focus:border-rose-400"
        required
      />

      <button
        type="submit"
        className="w-full rounded-full bg-ink py-3 text-xs font-semibold uppercase tracking-[0.4em] text-sand transition hover:bg-ink/90"
      >
        Unlock edit mode
      </button>

      {state.message && (
        <p
          className={`text-xs ${
            state.success ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
