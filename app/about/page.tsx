import AvatarUrlEditor from "@/components/AvatarUrlEditor";
import AvatarPreviewer from "@/components/AvatarPreviewer";
import EditableText from "@/components/EditableText";
import {
  saveAboutBio,
  saveAvatarUrl,
  saveAvatarPosition,
  saveMilestoneDescription,
  saveMilestoneYear,
  addMilestoneAction,
} from "@/lib/actions";
import { getSiteContent } from "@/lib/siteContent";
import { cookies } from "next/headers";
import ContactLinksEditor from "@/components/ContactLinksEditor";
import { AddMilestoneButton, DeleteMilestoneButton } from "@/components/MilestoneControls";

export default async function AboutPage() {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const content = await getSiteContent();

  return (
    <section className="space-y-12">
      <div className="grid gap-10 md:grid-cols-[auto,1fr]">
        <div>
          <AvatarPreviewer src={content.avatarUrl} position={content.avatarPosition} className="shadow-soft" />
          {isEditMode && (
            <AvatarUrlEditor
              initialValue={content.avatarUrl}
              position={content.avatarPosition}
              onSave={saveAvatarUrl}
              onSavePosition={saveAvatarPosition}
            />
          )}
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-ink/60">About</p>
          <h1 className="font-heading text-4xl text-ink">
            A slow-crafted studio practice
          </h1>
          <EditableText
            value={content.aboutBio}
            isEditMode={isEditMode}
            onSave={saveAboutBio}
            multiline
            className="text-base leading-relaxed text-ink/80"
            label="Short bio"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
            Life timeline
          </p>
          <h2 className="font-heading text-3xl text-ink">
            Milestones &amp; studio shifts
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="relative space-y-6 pl-8 lg:pl-0">
            <div
              className="pointer-events-none absolute left-4 top-0 h-full w-[2px] bg-ink/15 lg:left-[200px]"
              aria-hidden="true"
            />
            {content.milestones.map((milestone, index) => (
              <div key={milestone.id} className="space-y-3">
                <div
                  className="relative space-y-4 pl-6 lg:grid lg:grid-cols-[200px,1fr] lg:items-start lg:gap-8 lg:space-y-0 lg:pl-0"
                >
                  <div
                    className="flex justify-start lg:justify-end animate-reveal-left"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <EditableText
                      value={milestone.year}
                      isEditMode={isEditMode}
                      onSave={saveMilestoneYear.bind(null, milestone.id)}
                      className="text-xl font-heading text-ink text-left lg:text-right w-full"
                      label="Year"
                    />
                  </div>
                  <div
                    className="relative rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft animate-reveal-right"
                    style={{ animationDelay: `${index * 120 + 80}ms` }}
                  >
                    <span
                      className="absolute left-0 top-8 inline-flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-blush shadow-soft lg:-left-[14px]"
                      aria-hidden="true"
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <EditableText
                      value={milestone.description}
                      isEditMode={isEditMode}
                      onSave={saveMilestoneDescription.bind(null, milestone.id)}
                      multiline
                      className="text-sm leading-relaxed text-ink/80"
                      label="Description"
                    />
                    {isEditMode && (
                      <div className="mt-3 flex justify-end">
                        <DeleteMilestoneButton milestoneId={milestone.id} />
                      </div>
                    )}
                  </div>
                </div>
                {isEditMode && (
                  <div className="pl-6 lg:pl-0">
                    <AddMilestoneButton afterId={milestone.id} />
                  </div>
                )}
              </div>
            ))}
            {isEditMode && (
              <div className="pl-6 lg:pl-0">
                <AddMilestoneButton />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
              Stay in touch
            </p>
            <h3 className="font-heading text-2xl text-ink">
              Contacts &amp; social dispatches
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              Studio doors stay open online. Pick a channel to collaborate or keep up with new
              releases.
            </p>
            <div className="mt-4">
              <ContactLinksEditor links={content.contactLinks} isEditMode={isEditMode} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
