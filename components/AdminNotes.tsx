"use client";

import { useState } from "react";

type AdminNotesProps = {
  initial: string[];
  onSave: (notes: string[]) => Promise<any>;
  isEditMode: boolean;
};

export default function AdminNotes({ initial, onSave, isEditMode }: AdminNotesProps) {
  const [notes, setNotes] = useState<string[]>(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setPending(true);
    setMessage(null);
    await onSave(notes);
    setPending(false);
    setMessage("Saved");
    setTimeout(() => setMessage(null), 1200);
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft">
      <p className="text-xs uppercase tracking-[0.4em] text-ink/60">备忘录</p>
      {isEditMode ? (
        <>
          <div className="mt-3 space-y-3">
            {notes.map((note, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={note}
                  onChange={(e) => {
                    const next = [...notes];
                    next[idx] = e.target.value;
                    setNotes(next);
                  }}
                  className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm text-ink outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setNotes(notes.filter((_, i) => i !== idx))}
                  className="rounded-full border border-rose-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setNotes([...notes, "新备忘"])}
              className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink transition hover:border-ink hover:bg-ink hover:text-sand"
            >
              Add item
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.25em]">
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="rounded-full bg-ink px-4 py-2 font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save"}
            </button>
            {message && <span className="text-emerald-600">{message}</span>}
          </div>
        </>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-ink/80">
          {notes.length === 0 ? (
            <p className="text-ink/60">暂无备忘。开启 Edit Mode 后添加。</p>
          ) : (
            notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-ink/30" />
                <p>{note}</p>
              </div>
            ))
          )}
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
            开启 Edit Mode 后可编辑
          </p>
        </div>
      )}
    </div>
  );
}
