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
    <div className="relative space-y-8 diary-wrapper">
      <div
        className="pointer-events-none absolute left-4 top-0 hidden h-full border-l border-ink/10 md:block diary-line"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-6 diary-stack">
        {entries.map((entry, index) => (
          <article
            key={entry.id}
            className="relative pl-6 md:pl-12 animate-layer-reveal bg-transparent diary-card"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <span
              className="diary-marker absolute left-2 md:left-4 top-1/2 inline-flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blush shadow-soft"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            <div className="rounded-3xl border border-ink/10 p-6 shadow-none diary-card-inner">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 diary-card-header">
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
                <div className="mt-4 diary-details">
                  <EditableImage
                    value={entry.cover}
                    isEditMode={isEditMode && editingId === entry.id}
                    onSave={entry.onUpdateCover}
                    className={entry.cover ? "h-56" : "p-4"}
                    label="Cover image"
                  />
                </div>
              )}

              <div className="mt-4 rounded-2xl p-4 diary-details" style={{ background: "linear-gradient(135deg, rgba(255,245,232,0.85), rgba(255,230,200,0.7))" }}>
                {isEditMode && editingId === entry.id ? (
                  <DiaryRichEditor value={entry.content} onSave={entry.onUpdateContent} label="Diary text" />
                ) : (
                  <div className="markdown-content markdown-preview line-clamp-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
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
