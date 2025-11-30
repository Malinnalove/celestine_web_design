"use client";

import { useTransition, useState } from "react";
import type { ContactLink } from "@/lib/siteContent";
import {
  addContactLinkAction,
  deleteContactLinkAction,
  updateContactLinkAction,
} from "@/lib/actions";

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
                    placeholder="Icon (emoji/char)"
                  />
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
                    {contact.icon && <span>{contact.icon}</span>}
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
