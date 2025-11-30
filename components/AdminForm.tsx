"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createPost } from "@/lib/actions";
import { actionInitialState } from "@/lib/actionState";

export default function AdminForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createPost, actionInitialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-[40px] border border-ink/10 bg-white/80 p-8 shadow-soft"
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Title
        </label>
        <input
          name="title"
          required
          className="mt-2 w-full rounded-full border border-ink/20 px-5 py-3 text-sm uppercase tracking-[0.3em] text-ink outline-none focus:border-rose-400"
          placeholder="Enter a descriptive title"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Type
        </label>
        <select
          name="type"
          required
          className="mt-2 w-full rounded-full border border-ink/20 px-5 py-3 text-sm uppercase tracking-[0.3em] text-ink outline-none focus:border-rose-400"
          defaultValue="diary"
        >
          <option value="diary">Diary</option>
          <option value="photo">Photo</option>
          <option value="article">Article</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Content
        </label>
        <textarea
          name="content"
          required
          rows={5}
          className="mt-2 w-full rounded-3xl border border-ink/20 px-5 py-3 text-sm leading-relaxed text-ink outline-none focus:border-rose-400"
          placeholder="Write the body of the post..."
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Image URLs
        </label>
        <input
          name="images"
          className="mt-2 w-full rounded-full border border-ink/20 px-5 py-3 text-sm text-ink outline-none focus:border-rose-400"
          placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
        />
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-ink/60">
          Only used for Photo posts · separate multiple URLs with commas.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
      >
        Publish Post
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
