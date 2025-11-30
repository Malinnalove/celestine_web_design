import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CommentSection from "@/components/CommentSection";
import { getCommentsByPostId, getPostById } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { formatImageSrc } from "@/lib/media";

type Params = {
  params: {
    id: string;
  };
};

export default async function PostDetailPage({ params }: Params) {
  const post = await getPostById(params.id);

  if (!post) {
    notFound();
  }

  const postComments = await getCommentsByPostId(post.id);

  return (
    <div className="space-y-8">
      <article className="space-y-6 rounded-[48px] border border-ink/10 bg-white/80 p-10 shadow-soft">
        <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-ink/60">
          <span className="rounded-full border border-ink/20 px-3 py-1 text-[11px] font-semibold text-ink/70">
            {post.type}
          </span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        <div>
          <h1 className="font-heading text-4xl text-ink">
            {post.title}
          </h1>
        </div>

        {post.type !== "photo" && post.images[0] && (
          <div className="relative h-72 overflow-hidden rounded-3xl border border-ink/10 bg-sand/80">
            <Image
              src={formatImageSrc(post.images[0], "?auto=format&fit=crop&w=1400&q=90")}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 75vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        {post.type === "photo" && post.images.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {post.images.map((image, index) => (
              <div
                key={image}
                className="relative h-60 overflow-hidden rounded-3xl border border-ink/10 bg-sand/80"
              >
                <Image
                  src={formatImageSrc(image, "?auto=format&fit=crop&w=900&q=80")}
                  alt={`${post.title} photo ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </article>

      <CommentSection postId={post.id} items={postComments} />
    </div>
  );
}
