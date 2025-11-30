import EditModeLogin from "@/components/EditModeLogin";
import EditModeBadge from "@/components/EditModeBadge";
import AdminNotes from "@/components/AdminNotes";
import { disableEditMode, enableEditMode, updateAdminNotesAction } from "@/lib/actions";
import { getSiteContent } from "@/lib/siteContent";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const content = await getSiteContent();

  return (
    <section className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
          Admin studio
        </p>
        <h1 className="font-heading text-4xl text-ink">Editorial control room</h1>
        <p className="max-w-2xl text-sm text-ink/70">
          Toggle edit mode to rewrite inline copy or swap visuals directly on each page.
          Publishing new diary, photo, or article posts still happens below.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isEditMode ? (
          <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
              Current status
            </p>
            <h2 className="font-heading text-2xl text-ink">Edit mode unlocked</h2>
            <p className="mt-2 text-sm text-ink/70">
              Editable areas are highlighted in blush anywhere on the site. Close edit mode when you&apos;re done.
            </p>
            <div className="mt-4">
              <EditModeBadge onDisable={disableEditMode} />
            </div>
          </div>
        ) : (
          <EditModeLogin action={enableEditMode} />
        )}

        <AdminNotes initial={content.adminNotes} onSave={updateAdminNotesAction} />
      </div>
    </section>
  );
}
