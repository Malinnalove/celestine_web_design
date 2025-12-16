"use client";

import { useTransition, useState } from "react";
import type { ContactLink } from "@/lib/siteContent";
import {
  addContactLinkAction,
  deleteContactLinkAction,
  updateContactLinkAction,
} from "@/lib/actions";

type IconName = "facebook" | "youtube" | "instagram" | "twitter" | "x" | "linkedin" | "github" | "link" | "website" | "qq";

const iconMap: Record<IconName, JSX.Element> = {
  facebook: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06C2 17.09 5.66 21.24 10.44 22v-7.02H7.9v-2.92h2.54v-2.23c0-2.52 1.5-3.91 3.8-3.91 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.58v1.89h2.79l-.45 2.92h-2.34V22C18.34 21.24 22 17.09 22 12.06Z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C15.7 4 12 4 12 4h-.1s-3.7 0-6.7.3c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S2 8.8 2 10.3v1.4c0 1.5.2 3.1.2 3.1s.2 1.4.8 2c.8.8 1.9.8 2.4.9 1.8.2 6.6.3 6.6.3s3.7 0 6.7-.3c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.5.2-3.1v-1.4c0-1.5-.2-3.1-.2-3.1ZM10 14.7V8.9l4.9 2.9Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm5 3.4A3.6 3.6 0 1 1 8.4 12 3.6 3.6 0 0 1 12 8.4Zm0 1.8A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2Zm4.35-3.15a.75.75 0 1 1-.75.75.75.75 0 0 1 .75-.75Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M19.5 7.2c.9-.5 1.6-1.3 1.9-2.3-.8.5-1.8.8-2.8 1a3.3 3.3 0 0 0-5.7 2.2c0 .3 0 .5.1.8-2.8-.1-5.2-1.5-6.8-3.7a3.3 3.3 0 0 0 1 4.4c-.7 0-1.4-.2-2-.5v.1a3.3 3.3 0 0 0 2.6 3.2 3.3 3.3 0 0 1-1.5.1 3.3 3.3 0 0 0 3 2.2 6.6 6.6 0 0 1-4.1 1.4h-.8a9.3 9.3 0 0 0 5 1.4c6 0 9.4-5 9.4-9.4v-.4c.6-.4 1.3-1 1.8-1.6Z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M15.6 4h2.7l-5.8 6.6 6.8 9.4h-5.3l-4-5.5L5 20H2.3l6.3-7.1L2.1 4h5.4l3.6 4.9Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M4.7 3.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4ZM3 8.2h3.5v12.3H3Zm5.8 0h3.4v1.7h.1c.5-.8 1.6-1.6 3.3-1.6 3.5 0 4.1 2.2 4.1 5.1v6h-3.5v-5.4c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.5H8.8Z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 .7a11.3 11.3 0 0 0-3.6 22.1c.6.1.8-.3.8-.6v-2c-3.4.7-4.1-1.7-4.1-1.7-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.6 2.5 1.1 3 .9.1-.6.4-1.1.7-1.3-2.7-.3-5.5-1.4-5.5-6.1 0-1.4.5-2.5 1.3-3.5-.1-.3-.6-1.6.1-3.2 0 0 1.1-.3 3.6 1.3a12.5 12.5 0 0 1 6.6 0c2.5-1.6 3.6-1.3 3.6-1.3.7 1.6.3 2.9.1 3.2.8 1 1.3 2.1 1.3 3.5 0 4.7-2.8 5.8-5.5 6.1.4.3.8 1 .8 2v3c0 .3.2.7.8.6A11.3 11.3 0 0 0 12 .7Z" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="1.6">
      <path d="M10.6 13.4a3 3 0 0 0 4.2 0l3.4-3.4a3 3 0 1 0-4.3-4.3l-1.1 1.1M13.4 10.6a3 3 0 0 0-4.2 0L5.8 14a3 3 0 0 0 4.3 4.3l1.1-1.1" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3s3 3.5 3 9-3 9-3 9M12 3s-3 3.5-3 9 3 9 3 9" />
    </svg>
  ),
  qq: (
    <svg viewBox="0 0 1024 1024" className="h-5 w-5 fill-current">
      <path d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z" />
    </svg>
  ),

};

function renderIcon(icon?: string) {
  if (!icon) return null;
  const key = icon.trim().toLowerCase() as IconName;
  if (iconMap[key]) return iconMap[key];
  return <span className="text-sm">{icon}</span>;
}

type Props = {
  links: ContactLink[];
  isEditMode: boolean;
};

export default function ContactLinksEditor({ links, isEditMode }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ContactLink>>(
    Object.fromEntries(links.map((link) => [link.id, link])),
  );

  const setDraft = (id: string, field: keyof ContactLink, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = (id: string) => {
    const draft = drafts[id];
    startTransition(async () => {
      await updateContactLinkAction(id, {
        label: draft.label,
        value: draft.value,
        href: draft.href,
        icon: draft.icon,
      });
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
    });
  };

  return (
    <div className="space-y-4">
      <ul className="mt-4 space-y-3 text-sm text-ink/80">
        {links.map((contact) => {
          const draft = drafts[contact.id] ?? contact;
          const iconVisual = renderIcon(draft.icon);
          return (
            <li key={contact.id} className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white/70 p-3">
              {isEditMode ? (
                <>
                  <input
                    value={draft.label}
                    onChange={(e) => setDraft(contact.id, "label", e.target.value)}
                    className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink outline-none focus:border-rose-400"
                  />
                  <input
                    value={draft.value}
                    onChange={(e) => setDraft(contact.id, "value", e.target.value)}
                    className="rounded-full border border-ink/20 px-3 py-1 text-sm text-ink outline-none focus:border-rose-400"
                    placeholder="Display text"
                  />
                  <input
                    value={draft.href}
                    onChange={(e) => setDraft(contact.id, "href", e.target.value)}
                    className="rounded-full border border-ink/20 px-3 py-1 text-sm text-ink outline-none focus:border-rose-400"
                    placeholder="https://... (留空则纯文本)"
                  />
                  <input
                    value={draft.icon ?? ""}
                    onChange={(e) => setDraft(contact.id, "icon", e.target.value)}
                    className="rounded-full border border-ink/20 px-3 py-1 text-sm text-ink outline-none focus:border-rose-400"
                    placeholder="Icon (facebook / youtube / emoji)"
                  />
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink/60">
                    <span className="rounded-full bg-ink/5 px-2 py-1 text-ink/80">
                      预览: {iconVisual || "无"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleSave(contact.id)}
                      className="rounded-full border border-ink/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink transition hover:border-ink hover:bg-ink hover:text-sand disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteContactLinkAction(contact.id);
                        })
                      }
                      className="rounded-full border border-rose-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/50">
                    {renderIcon(contact.icon) && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-ink icon-glide">
                        {renderIcon(contact.icon)}
                      </span>
                    )}
                    {contact.label}
                  </p>
                  {contact.href ? (
                    <a
                      href={contact.href}
                      className="text-base font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <p className="text-base font-semibold text-ink">{contact.value}</p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {isEditMode && (
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em]">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => { await addContactLinkAction(); })}
            className="rounded-full border border-ink/20 px-4 py-2 font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-sand disabled:opacity-60"
          >
            Add link
          </button>
          {message && <span className="text-emerald-600">{message}</span>}
        </div>
      )}
    </div>
  );
}
