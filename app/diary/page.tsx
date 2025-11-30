import { cookies } from "next/headers";
import DiaryTimeline from "@/components/DiaryTimeline";
import DiaryEntryForm from "@/components/DiaryEntryForm";
import { updateDiaryContent, updateDiaryCover } from "@/lib/actions";
import { getPostsByType } from "@/lib/data";

export default async function DiaryPage() {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const posts = (await getPostsByType("diary")).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const entries = posts.map((post) => {
    const createdAt = new Date(post.createdAt);
    return {
      id: post.id,
      year: createdAt.getFullYear().toString(),
      month: createdAt.toLocaleDateString("en", { month: "short" }),
      title: post.title,
      content: post.content,
      cover: post.images[0] ?? "",
      link: `/post/${post.id}`,
      onUpdateContent: updateDiaryContent.bind(null, post.id),
      onUpdateCover: updateDiaryCover.bind(null, post.id),
    };
  });

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
          Diary Timeline
        </p>
        <h1 className="font-heading text-4xl text-ink">
          Sliding chronology of reflections
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">
          Scroll down the vertical timeline to drift through seasons. Each entry is plotted
          by year and month so the entire archive stays visible at a glance.
        </p>
      </div>

      {isEditMode && (
        <div className="rounded-[40px] border border-ink/10 bg-white/80 p-6 shadow-soft">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
              Add a fresh entry
            </p>
            <h2 className="font-heading text-2xl text-ink">
              Capture a new story right here
            </h2>
            <p className="text-sm text-ink/70">
              With edit mode enabled you can publish without leaving the timeline.
            </p>
          </div>
          <div className="mt-4">
            <DiaryEntryForm />
          </div>
        </div>
      )}

      <DiaryTimeline entries={entries} isEditMode={isEditMode} />
    </section>
  );
}
