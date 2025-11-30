"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addComment } from "@/lib/actions";
import { actionInitialState, type ActionState } from "@/lib/actionState";
import type { Comment } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type Props = {
  postId: string;
  items: Comment[];
};

export default function CommentSection({ postId, items }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const createComment = addComment.bind(null, postId);
  const [state, formAction] = useFormState<ActionState, FormData>(
    createComment,
    actionInitialState,
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <section className="space-y-6 rounded-[40px] border border-ink/10 bg-white/80 p-6 shadow-soft">
      <div>
        <h2 className="font-heading text-2xl text-ink">Comments</h2>
        <p className="text-sm text-ink/70">
          Share a quick thought. No login required.
        </p>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink/15 bg-sand/60 p-4 text-sm text-ink/60">
            No comments yet. Be the first to say hello!
          </p>
        )}
        {items.map((comment) => (
          <div
            key={`${comment.name}-${comment.createdAt}`}
            className="rounded-2xl border border-ink/10 bg-sand/60 p-4"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-ink/60">
              <span className="font-semibold text-ink">
                {comment.name}
              </span>
              <span>{formatDate(comment.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">{comment.text}</p>
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="space-y-3 rounded-2xl border border-ink/10 bg-sand/70 p-4"
      >
        <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-ink/60">
          <div className="flex flex-wrap gap-3">
            <input
              name="name"
              required
              className="min-w-[140px] flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm text-ink outline-none focus:border-rose-400"
              placeholder="Name"
            />
            <input
              name="text"
              required
              className="flex-[3] min-w-[240px] rounded-full border border-ink/20 px-4 py-2 text-sm text-ink outline-none focus:border-rose-400"
              placeholder="Comment"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
        >
          Post Comment
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
    </section>
  );
}
