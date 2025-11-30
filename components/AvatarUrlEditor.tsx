"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/actionState";

type AvatarUrlEditorProps = {
  initialValue: string;
  onSave: (formData: FormData) => Promise<ActionState>;
  position: string;
  onSavePosition: (formData: FormData) => Promise<ActionState>;
};

const positionOptions = [
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Top left", value: "left top" },
  { label: "Top right", value: "right top" },
  { label: "Bottom left", value: "left bottom" },
  { label: "Bottom right", value: "right bottom" },
];

export default function AvatarUrlEditor({
  initialValue,
  onSave,
  position,
  onSavePosition,
}: AvatarUrlEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [filename, setFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState(position);
  const [message, setMessage] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
    setFilename("");
    setCurrentPosition(position);
  }, [initialValue, position]);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("value", value);
      const result = await onSave(formData);
      setMessage(result);
    });
  };

  const handleSavePosition = (nextPosition: string) => {
    setCurrentPosition(nextPosition);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("value", nextPosition);
      const result = await onSavePosition(formData);
      setMessage(result);
    });
  };

  return (
    <div className="mt-4 space-y-2 rounded-2xl border border-ink/10 bg-white/80 p-4 text-xs uppercase tracking-[0.3em] text-ink">
      <p className="font-semibold">Avatar Source</p>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="https://images.unsplash.com/..."
        className="w-full rounded-full border border-ink/20 px-4 py-2 text-[10px] tracking-[0.25em] outline-none focus:border-rose-400"
      />
      <div className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.25em] text-ink/60">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border border-ink/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition hover:border-ink hover:bg-ink hover:text-sand"
        >
          Upload from device
        </button>
        {filename && <span className="text-ink/70">{filename}</span>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async ({ target }) => {
            const file = target.files?.[0];
            if (!file) return;
            setUploadError(null);
            setUploading(true);
            setFilename(file.name);
            try {
              const formData = new FormData();
              formData.append("file", file);
              const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });
              const text = await res.text();
              const data = text ? (JSON.parse(text) as { url?: string; error?: string }) : {};
              if (!res.ok || !data.url) {
                throw new Error(data.error || "Upload failed");
              }
              setValue(data.url);
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : "Upload failed");
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>
      <div className="space-y-1">
        <p className="font-semibold uppercase tracking-[0.3em] text-ink/60 text-[11px]">
          Focus point
        </p>
        <select
          value={currentPosition}
          onChange={(event) => handleSavePosition(event.target.value)}
          className="w-full rounded-full border border-ink/20 bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-ink outline-none focus:border-rose-400"
        >
          {positionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || uploading}
        className="w-full rounded-full bg-ink py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90 disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Save"}
      </button>
      {uploadError && <p className="text-[10px] text-rose-500">{uploadError}</p>}
      {message && (
        <p
          className={`text-[10px] ${
            message.success ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {message.message}
        </p>
      )}
    </div>
  );
}
