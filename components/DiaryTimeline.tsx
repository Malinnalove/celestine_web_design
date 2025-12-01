"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import EditableImage from "./EditableImage";
import DiaryRichEditor from "./DiaryRichEditor";
import type { ActionState } from "@/lib/actionState";

type TimelineEntry = {
  id: string;
  year: string;
  month: string;
  title: string;
  content: string;
  cover: string;
  link: string;
  onUpdateContent: (value: string) => Promise<ActionState>;
  onUpdateCover: (value: string) => Promise<ActionState>;
};

type DiaryTimelineProps = {
  entries: TimelineEntry[];
  isEditMode: boolean;
};

export default function DiaryTimeline({ entries, isEditMode }: DiaryTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-ink/15 bg-sand/70 p-6 text-center text-sm text-ink/60">
        No diary entries yet. Start by publishing one above.
      </p>
    );
  }

  return (
    <div className="relative space-y-8">
      <div
        className="pointer-events-none absolute left-4 top-0 hidden h-full w-[2px] bg-ink/10 md:block"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-6">
        {entries.map((entry, index) => (
          <article
            key={entry.id}
            className="relative pl-6 md:pl-12 animate-layer-reveal"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <span
              className="absolute left-2 top-10 inline-flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-blush shadow-soft md:left-4"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>

            <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-ink/50">
                      {entry.month} {entry.year}
                    </p>
                    <h3 className="font-heading text-2xl text-ink">{entry.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em]">
                    <Link
                      href={entry.link}
                      className="rounded-full border border-ink/20 px-3 py-1 text-[11px] transition hover:border-ink hover:bg-ink hover:text-sand"
                    >
                      Read entry
                    </Link>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => setEditingId(editingId === entry.id ? null : entry.id)}
                        className="rounded-full border border-ink/20 px-3 py-1 text-[11px] transition hover:border-ink hover:bg-ink hover:text-sand"
                      >
                        {editingId === entry.id ? "Done" : "Edit"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(entry.cover || (isEditMode && editingId === entry.id)) && (
                <div className="mt-4">
                  <EditableImage
                    value={entry.cover}
                    isEditMode={isEditMode && editingId === entry.id}
                    onSave={entry.onUpdateCover}
                    className={entry.cover ? "h-56" : "p-4"}
                    label="Cover image"
                  />
                </div>
              )}

              <div className="mt-4">
                {isEditMode && editingId === entry.id ? (
                  <DiaryRichEditor
                    value={entry.content}
                    onSave={entry.onUpdateContent}
                    label="Diary text"
                  />
                ) : (
                  <div className="markdown-content markdown-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {entry.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
