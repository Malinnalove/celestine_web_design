import EditableText from "@/components/EditableText";
import { saveHeroEyebrow, saveHeroTitle, saveHomeIntro } from "@/lib/actions";
import { getMoodEntries, getPostsByType } from "@/lib/data";
import { getSiteContent } from "@/lib/siteContent";
import { formatImageSrc } from "@/lib/media";
import { markdownToPlainText } from "@/lib/markdown";
import { cookies } from "next/headers";
import Link from "next/link";
import EmotionHeatmap from "@/components/EmotionHeatmap";

export const dynamic = "force-dynamic";

type MoodSeed = {
  date: string;
  mood: "joy" | "anger" | "calm" | "fatigue" | "sadness";
  intensity: 1 | 2 | 3;
  note?: string;
};

function buildDiaryLinks(posts: Awaited<ReturnType<typeof getPostsByType>>): Record<string, { url: string; title: string }> {
  return posts.reduce((acc, post) => {
    const date = new Date(post.createdAt);
    const key = date.toISOString().split("T")[0];
    acc[key] = { url: `/post/${post.id}`, title: post.title };
    return acc;
  }, {} as Record<string, { url: string; title: string }>);
}

function sampleEmotionSeeds(diaryLinks: Record<string, { url: string; title: string }>): MoodSeed[] {
  const today = new Date();
  const seeds: MoodSeed[] = [];
  const moods: MoodSeed["mood"][] = ["joy", "anger", "calm", "fatigue", "sadness"];

  // Prefill diary dates with calm notes
  Object.entries(diaryLinks).forEach(([date, info], idx) => {
    seeds.push({
      date,
      mood: moods[idx % moods.length],
      intensity: 2,
      note: `日记：${info.title}`,
    });
  });

  // Add some random days for visual density
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 4 - (i % 3));
    const date = d.toISOString().split("T")[0];
    if (diaryLinks[date]) continue;
    const mood = moods[(i + 2) % moods.length];
    seeds.push({
      date,
      mood,
      intensity: ((i % 3) + 1) as 1 | 2 | 3,
      note: i % 5 === 0 ? "简短情绪记录" : "",
    });
  }
  return seeds;
}

export default async function HomePage() {
  const cookieStore = cookies();
  const isEditMode = cookieStore.get("edit-mode")?.value === "true";
  const siteContent = await getSiteContent();

  const diaryPosts = await getPostsByType("diary");
  const diaryEntries = [...diaryPosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
  const diaryLinks = buildDiaryLinks(diaryPosts);
  const moodEntries = await getMoodEntries();

  const photoThumbnails = (await getPostsByType("photo"))
    .flatMap((post) =>
      post.images.map((image) => ({
        id: `${post.id}-${image}`,
        image,
        title: post.title,
      })),
    )
    .slice(0, 6);

  const ctaButtonClasses =
    "group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-ink/15 bg-white/60 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-ink shadow-[0_15px_35px_rgba(0,0,0,0.08)]";

  return (
    <div className="space-y-16">
      <section className="interactive-panel group rounded-[48px] border border-ink/10 bg-white/80 p-10 shadow-soft">
        <EditableText
          value={siteContent.heroEyebrow}
          isEditMode={isEditMode}
          onSave={saveHeroEyebrow}
          className="text-xs uppercase tracking-[0.4em] text-ink/60"
          label="Hero eyebrow"
        />
        <EditableText
          value={siteContent.heroTitle}
          isEditMode={isEditMode}
          onSave={saveHeroTitle}
          className="mt-4 max-w-3xl font-heading text-5xl leading-tight text-ink"
          label="Hero title"
        />
        <EditableText
          value={siteContent.homeIntroduction}
          isEditMode={isEditMode}
          onSave={saveHomeIntro}
          multiline
          className="mt-6 max-w-3xl text-lg leading-relaxed text-ink/80"
          label="Home introduction"
        />
      </section>

      <EmotionHeatmap initialEntries={moodEntries.length ? moodEntries : sampleEmotionSeeds(diaryLinks)} diaryLinks={diaryLinks} />

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
              Latest diary entries
            </p>
            <h2 className="font-heading text-3xl text-ink">Freshly inked pages</h2>
          </div>
          <Link href="/diary" className={`${ctaButtonClasses} hover:border-transparent`}>
            <span className="relative z-10">View timeline</span>
            <span className="relative z-10 inline-flex h-2 w-2 rounded-full bg-ink transition group-hover:bg-white" />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-petal/0 via-blush/30 to-mist/0 opacity-0 transition duration-500 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-full w-full -skew-x-6 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition duration-700 group-hover:translate-x-10 group-hover:opacity-100"
            >
              <span className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent blur-xl" />
            </span>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {diaryEntries.map((entry) => (
            <article
              key={entry.id}
              className="group rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
                {new Date(entry.createdAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <h3 className="mt-2 font-heading text-2xl text-ink">{entry.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {`${markdownToPlainText(entry.content).slice(0, 220)}...`}
              </p>
              <Link
                href={`/post/${entry.id}`}
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink transition group-hover:text-blush"
              >
                Read entry
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-ink/60">
              Recent film roll
            </p>
            <h2 className="font-heading text-3xl text-ink">Photo thumbnails</h2>
          </div>
          <Link href="/gallery" className={`${ctaButtonClasses} hover:border-transparent`}>
            <span className="relative z-10">Open gallery</span>
            <span className="relative z-10 inline-flex h-2 w-2 rounded-full bg-ink transition group-hover:bg-white" />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-mist/0 via-white/40 to-petal/0 opacity-0 transition duration-500 group-hover:opacity-100"
            />
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-full w-full -skew-x-6 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition duration-700 group-hover:translate-x-10 group-hover:opacity-100"
            >
              <span className="absolute inset-x-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent blur-xl" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {photoThumbnails.map((photo) => (
            <div
              key={photo.id}
              className="aspect-[2/3] overflow-hidden rounded-3xl border border-ink/10 bg-sand/80 shadow-soft"
            >
              <div
                className="h-full w-full bg-cover bg-center transition duration-500 hover:scale-105"
                style={{
                  backgroundImage: `url(${formatImageSrc(photo.image, "?auto=format&fit=crop&w=600&q=80")})`,
                }}
                aria-label={photo.title}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
