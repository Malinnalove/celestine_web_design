"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { createDiaryEntry } from "@/lib/actions";
import { actionInitialState } from "@/lib/actionState";
import DiaryRichEditor from "./DiaryRichEditor";

export default function DiaryEntryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useFormState(createDiaryEntry, actionInitialState);
  const [content, setContent] = useState("");
  const [coverFileName, setCoverFileName] = useState("");

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setContent("");
      setCoverFileName("");
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className="space-y-4"
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Title
        </label>
        <input
          name="title"
          required
          className="mt-2 w-full rounded-full border border-ink/20 px-5 py-3 text-sm uppercase tracking-[0.3em] text-ink outline-none focus:border-rose-400"
          placeholder="Morning ritual reflections"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Content
        </label>
        <input type="hidden" name="content" value={content} />
        <DiaryRichEditor value={content} onChange={setContent} />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Cover image (optional)
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-ink/20 bg-sand/70 px-5 py-4 text-center text-xs uppercase tracking-[0.3em] text-ink/70 transition hover:border-ink/40"
        >
          <span className="rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink shadow-soft">
            Select cover
          </span>
          {coverFileName ? (
            <span className="mt-2 text-[11px] text-ink/80">{coverFileName}</span>
          ) : (
            <span className="mt-2 text-[11px] text-ink/60">Optional</span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          name="cover"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setCoverFileName(file ? file.name : "");
          }}
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
      >
        Publish diary entry
      </button>

      {state.message && (
        <p
          className={`text-sm ${
            state.success ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
