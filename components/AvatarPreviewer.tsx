"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import { formatImageSrc } from "@/lib/media";

type AvatarPreviewerProps = {
  src: string;
  position?: string;
  className?: string;
};

export default function AvatarPreviewer({ src, position = "center", className = "" }: AvatarPreviewerProps) {
  const [open, setOpen] = useState(false);
  const prepared = formatImageSrc(src, "?auto=format&fit=crop&w=1600&q=90");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full transition hover:scale-[1.02] focus:outline-none ${className}`}
      >
        <Avatar src={src} position={position} size="lg" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 py-10">
          <div className="relative max-w-2xl rounded-[32px] bg-white p-4 shadow-2xl">
            <img
              src={prepared}
              alt="Avatar preview"
              className="max-h-[70vh] w-full rounded-2xl object-cover"
              style={{ objectPosition: position }}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

