"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/actionState";
import { formatImageSrc } from "@/lib/media";

type EditableImageProps = {
  value: string;
  isEditMode: boolean;
  onSave: (nextValue: string) => Promise<ActionState>;
  className?: string;
  label?: string;
};

export default function EditableImage({
  value,
  isEditMode,
  onSave,
  className = "",
  label,
}: EditableImageProps) {
  const [input, setInput] = useState(value);
  const [message, setMessage] = useState<ActionState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setInput(value);
  }, [value]);

  const handleSave = () => {
    startTransition(async () => {
      const result = await onSave(input);
      setMessage(result);
    });
  };

  const hasImage = Boolean(value);

  return (
    <div
      className={`group relative rounded-3xl ${
        hasImage ? "overflow-hidden bg-ink/5" : "border border-dashed border-ink/20 bg-sand/50"
      } ${className} ${!hasImage ? "min-h-[120px]" : ""}`}
    >
      {hasImage && (
        <Image
          src={formatImageSrc(value, "?auto=format&fit=crop&w=1000&q=80")}
          alt="Editable visual"
          fill
          sizes="(max-width: 768px) 80vw, 30vw"
          className="object-cover"
        />
      )}

      {isEditMode && (
        <div className="relative z-10 space-y-3 bg-white/85 p-4 text-xs text-ink">
          {label && (
            <p className="font-semibold uppercase tracking-[0.3em] text-ink/60">
              {label}
            </p>
          )}
          <div className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.25em] text-ink/60">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink transition hover:border-ink hover:bg-ink hover:text-sand"
            >
              Upload image
            </button>
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
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  const text = await res.text();
                  const data = text ? (JSON.parse(text) as { url?: string; error?: string }) : {};
                  if (!res.ok || !data.url) {
                    throw new Error(data.error || "Upload failed");
                  }
                  setInput(data.url);
                } catch (error) {
                  setUploadError(error instanceof Error ? error.message : "Upload failed");
                } finally {
                  setUploading(false);
                }
              }}
            />
            <span>Select from your device.</span>
            <button
              type="button"
              onClick={() => setInput("")}
              className="text-left text-[11px] uppercase tracking-[0.25em] text-rose-500 underline"
            >
              Remove image
            </button>
          </div>
          <button
            type="button"
            disabled={isPending || uploading}
            onClick={handleSave}
            className="rounded-full bg-ink px-4 py-2 font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Save"}
          </button>
          {uploadError && (
            <p className="text-[11px] text-rose-500">
              {uploadError}
            </p>
          )}
          {message && (
            <p
              className={`text-[11px] ${
                message.success ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {message.message}
            </p>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sand/30 opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
