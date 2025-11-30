import Link from "next/link";
import type { Post } from "@/lib/data";
import { formatDate } from "@/lib/utils";

type Props = {
  posts: Post[];
  emptyLabel?: string;
};

export default function PostList({
  posts,
  emptyLabel = "No posts yet.",
}: Props) {
  if (!posts.length) {
    return (
      <p className="rounded-3xl border border-dashed border-ink/20 bg-white/80 p-8 text-center text-sm text-ink/60 shadow-soft">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-[40px] border border-ink/10 bg-white/80 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-ink/60">
            <span className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink/70">
              {post.type}
            </span>
            <span className="text-ink/70">{formatDate(post.createdAt)}</span>
          </div>
          <h2 className="mt-3 font-heading text-2xl text-ink">{post.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">{post.content}</p>
          <Link
            className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-ink hover:text-blush"
            href={`/post/${post.id}`}
          >
            Read more →
          </Link>
        </article>
      ))}
    </div>
  );
}

