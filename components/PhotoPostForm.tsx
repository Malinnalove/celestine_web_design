"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { createPhotoSet } from "@/lib/actions";
import { actionInitialState } from "@/lib/actionState";

export default function PhotoPostForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useFormState(createPhotoSet, actionInitialState);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setFileNames([]);
      setImageUrls([]);
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-5"
    >
      <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">
          Drop in new frames
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-ink/20 bg-sand/70 px-6 py-10 text-center transition hover:border-ink/40"
        >
          <span className="rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-ink shadow-soft">
            Select images
          </span>
          <span className="mt-4 text-xs uppercase tracking-[0.25em] text-ink/60">
            Supports JPG · PNG · GIF · WEBP
          </span>
          {fileNames.length > 0 && (
            <span className="mt-2 text-[11px] uppercase tracking-[0.25em] text-ink">
              {fileNames.length} file{fileNames.length > 1 ? "s" : ""} ready
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length === 0) return;
            setUploadError(null);
            setUploading(true);
            try {
              const uploaded: string[] = [];
              for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const text = await res.text();
                const data = text ? (JSON.parse(text) as { url?: string; error?: string }) : {};
                if (!res.ok || !data.url) {
                  throw new Error(data.error || "Upload failed");
                }
                uploaded.push(data.url);
              }
              setImageUrls(uploaded);
              setFileNames(files.map((file) => file.name));
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : "Upload failed");
              setImageUrls([]);
              setFileNames([]);
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>

      <button
        type="submit"
        disabled={uploading || imageUrls.length === 0}
        className="w-full rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
      >
        {uploading ? "Uploading..." : "Upload to gallery"}
      </button>

      {uploadError && <p className="text-sm text-rose-600">{uploadError}</p>}
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
