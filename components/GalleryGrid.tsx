"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import type { ActionState } from "@/lib/actionState";
import { formatImageSrc } from "@/lib/media";

type GalleryItem = {
  id: string;
  title: string;
  image: string;
  onUpdate: (value: string) => Promise<ActionState>;
};

type GalleryGridProps = {
  items: GalleryItem[];
  isEditMode: boolean;
};

export default function GalleryGrid({ items, isEditMode }: GalleryGridProps) {
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <figure
            key={`${item.id}-${item.image}`}
            className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-ink/10 bg-sand/80 shadow-soft"
          >
            <button
              type="button"
              onClick={() => setPreview(item)}
              className="absolute inset-0"
            >
              <Image
                src={formatImageSrc(item.image, "?auto=format&fit=crop&w=1000&q=80")}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent px-4 py-6 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {item.title}
              </figcaption>
            </button>

            {isEditMode && (
              <GalleryTileEditor initialValue={item.image} onUpdate={item.onUpdate} />
            )}
          </figure>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-40 bg-ink/60 px-4 py-10">
          <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-full border border-white/40 bg-white/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-soft transition hover:bg-white"
              >
                Close
              </button>
            </div>
            <div className="relative h-[80vh] overflow-hidden rounded-[48px] bg-white shadow-2xl">
              <Image
                src={formatImageSrc(preview.image, "?auto=format&fit=crop&w=1600&q=90")}
                alt={preview.title}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1280px) 75vw, 60vw"
                className="object-contain"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-10 py-8 text-white">
                <p className="text-sm uppercase tracking-[0.4em] text-petal">{preview.id}</p>
                <p className="font-heading text-3xl">{preview.title}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type GalleryTileEditorProps = {
  initialValue: string;
  onUpdate: (value: string) => Promise<ActionState>;
};

function GalleryTileEditor({ initialValue, onUpdate }: GalleryTileEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [message, setMessage] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const result = await onUpdate(value);
      setMessage(result);
    });
  };

  return (
    <div className="absolute inset-x-3 bottom-3 space-y-2 rounded-2xl border border-white/60 bg-white/90 p-3 text-[10px] uppercase tracking-[0.3em] text-ink">
      <p className="font-semibold">Replace image</p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-full border border-ink/20 py-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-ink transition hover:border-ink hover:bg-ink/5"
      >
        Upload from device
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
            setValue(data.url);
            startTransition(async () => {
              const response = await onUpdate(data.url!);
              setMessage(response);
            });
          } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Upload failed");
          } finally {
            setUploading(false);
          }
        }}
      />
      <button
        type="button"
        disabled={isPending || uploading}
        onClick={handleSave}
        className="w-full rounded-full bg-ink py-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90 disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Save"}
      </button>
      <button
        type="button"
        disabled={isPending || uploading}
        onClick={() => {
          setValue("");
          startTransition(async () => {
            const response = await onUpdate("");
            setMessage(response);
          });
        }}
        className="w-full rounded-full border border-rose-400 py-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
      >
        Remove
      </button>
      {uploadError && <p className="text-[9px] text-rose-500">{uploadError}</p>}
      {message && (
        <p
          className={`text-[9px] ${
            message.success ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {message.message}
        </p>
      )}
    </div>
  );
}
