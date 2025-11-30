"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/actionState";

type DiaryRichEditorProps = {
  value: string;
  onSave?: (nextValue: string) => Promise<ActionState>;
  onChange?: (nextValue: string) => void;
  className?: string;
  label?: string;
};

export default function DiaryRichEditor({
  value,
  onSave,
  onChange,
  className = "",
  label,
}: DiaryRichEditorProps) {
  const [draft, setDraft] = useState(value);
  const [message, setMessage] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateDraft = (next: string) => {
    setDraft(next);
    onChange?.(next);
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value: current } = textarea;
    const selected = current.slice(selectionStart, selectionEnd);
    const next = `${current.slice(0, selectionStart)}${prefix}${selected}${suffix}${current.slice(selectionEnd)}`;
    updateDraft(next);
    // restore selection
    setTimeout(() => {
      textarea.focus();
      const offset = prefix.length;
      textarea.setSelectionRange(selectionStart + offset, selectionEnd + offset);
    }, 0);
  };

  const insertLine = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value: current } = textarea;
    const next = `${current.slice(0, selectionStart)}${text}\n${current.slice(selectionEnd)}`;
    updateDraft(next);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + text.length + 1, selectionStart + text.length + 1);
    }, 0);
  };

  const handleInsertImage = (dataUrl: string) => {
    insertLine(`![image](${dataUrl})`);
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        handleInsertImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!onSave) return;
    startTransition(async () => {
      const result = await onSave(draft);
      setMessage(result);
    });
  };

  return (
    <div className={`space-y-3 rounded-3xl border border-ink/10 bg-white/70 p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {label && (
          <p className="text-xs uppercase tracking-[0.3em] text-ink/60">
            {label}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/70">
          <button
            type="button"
            className="rounded-full bg-sand px-3 py-1 transition hover:bg-ink hover:text-sand"
            onClick={() => wrapSelection("**")}
          >
            B
          </button>
          <button
            type="button"
            className="rounded-full bg-sand px-3 py-1 transition hover:bg-ink hover:text-sand"
            onClick={() => wrapSelection("_")}
          >
            I
          </button>
          <button
            type="button"
            className="rounded-full bg-sand px-3 py-1 transition hover:bg-ink hover:text-sand"
            onClick={() => insertLine("### ")}
          >
            H3
          </button>
          <button
            type="button"
            className="rounded-full bg-sand px-3 py-1 transition hover:bg-ink hover:text-sand"
            onClick={() => insertLine("- ")}
          >
            List
          </button>
          <button
            type="button"
            className="rounded-full bg-sand px-3 py-1 transition hover:bg-ink hover:text-sand"
            onClick={() => insertLine("> ")}
          >
            Quote
          </button>
          <button
            type="button"
            className="rounded-full bg-sand px-3 py-1 transition hover:bg-ink hover:text-sand"
            onClick={() => fileInputRef.current?.click()}
          >
            Insert image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleUpload(file);
              }
            }}
          />
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => updateDraft(event.target.value)}
        rows={8}
        className="w-full rounded-2xl border border-ink/15 bg-sand/50 px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:border-ink/50"
        placeholder="Write in Markdown…"
      />

      {onSave && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full bg-ink px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90 disabled:opacity-60"
          >
            Save
          </button>
          {message && (
            <span
              className={`text-[11px] ${
                message.success ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {message.message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

