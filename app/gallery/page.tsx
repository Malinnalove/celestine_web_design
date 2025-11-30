import { cookies } from "next/headers";
import GalleryGrid from "@/components/GalleryGrid";
import PhotoPostForm from "@/components/PhotoPostForm";
import { updateGalleryImage, updateGalleryTextAction } from "@/lib/actions";
import { getPostsByType } from "@/lib/data";
import { getSiteContent } from "@/lib/siteContent";
import EditableText from "@/components/EditableText";

export default async function GalleryPage() {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const siteContent = await getSiteContent();
  const photoPosts = (await getPostsByType("photo")).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const tiles = photoPosts.flatMap((post) =>
    post.images.map((image, index) => ({
      id: `${post.id}-${index}`,
      title: `${post.title} · Frame ${index + 1}`,
      image,
      onUpdate: updateGalleryImage.bind(null, post.id, index),
    })),
  );

  return (
    <section className="space-y-8">
      <div>
        <EditableText
          value={siteContent.galleryEyebrow}
          isEditMode={isEditMode}
          onSave={updateGalleryTextAction.bind(null, "eyebrow")}
          className="text-xs uppercase tracking-[0.4em] text-ink/60"
          label="Gallery eyebrow"
        />
        <EditableText
          value={siteContent.galleryTitle}
          isEditMode={isEditMode}
          onSave={updateGalleryTextAction.bind(null, "title")}
          className="font-heading text-4xl text-ink"
          label="Gallery title"
        />
        <EditableText
          value={siteContent.galleryDescription}
          isEditMode={isEditMode}
          onSave={updateGalleryTextAction.bind(null, "description")}
          multiline
          className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70"
          label="Gallery description"
        />
      </div>

      {isEditMode && (
        <div className="rounded-[40px] border border-ink/10 bg-white/80 p-6 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
              Add to the gallery
            </p>
            <h2 className="font-heading text-2xl text-ink">
              Publish a new photo story
            </h2>
            <p className="text-sm text-ink/70">
              Drop fresh image sets straight onto this grid while edit mode is active.
            </p>
          </div>
          <div className="mt-4">
            <PhotoPostForm />
          </div>
        </div>
      )}

      <GalleryGrid items={tiles} isEditMode={isEditMode} />
    </section>
  );
}
