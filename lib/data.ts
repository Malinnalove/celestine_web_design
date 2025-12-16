import { randomUUID } from "crypto";
import client from "./db";

export type PostType = "diary" | "photo" | "article";

export type Post = {
  id: string;
  title: string;
  type: PostType;
  content: string;
  images: string[];
  createdAt: string;
};

export type Comment = {
  name: string;
  text: string;
  createdAt: string;
};

export type MoodEntry = {
  date: string; // yyyy-mm-dd
  mood: "joy" | "anger" | "calm" | "fatigue" | "sadness";
  intensity: 1 | 2 | 3;
  note?: string;
};

type PostRow = {
  id: string;
  title: string;
  type: string;
  content: string;
  created_at: string;
};

let moodTableReady: Promise<void> | null = null;

async function ensureMoodTable() {
  if (!moodTableReady) {
    moodTableReady = (async () => {
      await client.execute(
        "create table if not exists mood_entries (id text primary key, date text unique, mood text, intensity integer, note text default '', created_at text default (datetime('now')))",
      );
    })();
  }
  return moodTableReady;
}

const mapPost = (row: PostRow, images: string[]): Post => ({
  id: row.id,
  title: row.title,
  type: row.type as PostType,
  content: row.content,
  images,
  createdAt: row.created_at ?? new Date().toISOString(),
});

async function fetchImagesByPostIds(postIds: string[]): Promise<Record<string, string[]>> {
  if (postIds.length === 0) {
    return {};
  }

  const placeholders = postIds.map(() => "?").join(", ");
  const { rows } = await client.execute({
    sql: `select post_id, url, position from post_images where post_id in (${placeholders}) order by position asc`,
    args: postIds,
  });

  const grouped: Record<string, string[]> = {};
  const imageRows = rows as unknown as { post_id: string; url: string }[];
  for (const row of imageRows) {
    if (!grouped[row.post_id]) {
      grouped[row.post_id] = [];
    }
    grouped[row.post_id].push(row.url);
  }
  return grouped;
}

async function replaceImages(postId: string, images: string[]) {
  await client.execute({ sql: "delete from post_images where post_id = ?", args: [postId] });
  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map((url, index) =>
      client.execute({
        sql: "insert into post_images (post_id, url, position) values (?, ?, ?)",
        args: [postId, url, index],
      }),
    ),
  );
}

export async function getPosts(): Promise<Post[]> {
  const { rows } = await client.execute(
    "select id, title, type, content, created_at from posts order by created_at desc",
  );
  const postRows = rows as unknown as PostRow[];
  const ids = postRows.map((row) => row.id);
  const imagesByPost = await fetchImagesByPostIds(ids);

  return postRows.map((row) => mapPost(row, imagesByPost[row.id] ?? []));
}

export async function getPostsByType(type: PostType): Promise<Post[]> {
  const { rows } = await client.execute({
    sql: "select id, title, type, content, created_at from posts where type = ? order by created_at desc",
    args: [type],
  });
  const postRows = rows as unknown as PostRow[];
  const ids = postRows.map((row) => row.id);
  const imagesByPost = await fetchImagesByPostIds(ids);

  return postRows.map((row) => mapPost(row, imagesByPost[row.id] ?? []));
}

export async function getPostById(id: string): Promise<Post | null> {
  const { rows } = await client.execute({
    sql: "select id, title, type, content, created_at from posts where id = ? limit 1",
    args: [id],
  });

  const row = (rows as unknown as PostRow[])[0];
  if (!row) {
    return null;
  }

  const imagesByPost = await fetchImagesByPostIds([id]);
  return mapPost(row, imagesByPost[id] ?? []);
}

export async function insertPost(
  post: Omit<Post, "id" | "createdAt"> & { id?: string },
): Promise<Post> {
  const id = post.id ?? randomUUID();
  const createdAt = new Date().toISOString();

  await client.execute({
    sql: "insert into posts (id, title, type, content, created_at) values (?, ?, ?, ?, ?)",
    args: [id, post.title, post.type, post.content, createdAt],
  });

  await replaceImages(id, post.images ?? []);

  return {
    id,
    createdAt,
    ...post,
  };
}

export async function insertComment(
  postId: string,
  comment: Omit<Comment, "createdAt">,
): Promise<Comment> {
  const createdAt = new Date().toISOString();
  await client.execute({
    sql: "insert into comments (post_id, name, text, created_at) values (?, ?, ?, ?)",
    args: [postId, comment.name, comment.text, createdAt],
  });

  return { ...comment, createdAt };
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const { rows } = await client.execute({
    sql: "select name, text, created_at from comments where post_id = ? order by created_at desc",
    args: [postId],
  });

  const commentRows = rows as unknown as { name: string; text: string; created_at: string }[];
  return commentRows.map((row) => ({
    name: row.name,
    text: row.text,
    createdAt: row.created_at ?? new Date().toISOString(),
  }));
}

export async function updatePostById(
  postId: string,
  payload: Partial<Omit<Post, "id" | "images" | "createdAt">>,
): Promise<Post | null> {
  const fields: string[] = [];
  const args: (string | PostType)[] = [];

  if (payload.title !== undefined) {
    fields.push("title = ?");
    args.push(payload.title);
  }
  if (payload.content !== undefined) {
    fields.push("content = ?");
    args.push(payload.content);
  }
  if (payload.type !== undefined) {
    fields.push("type = ?");
    args.push(payload.type);
  }

  if (fields.length > 0) {
    const updateArgs: (string | PostType)[] = [...args, postId];
    await client.execute(`update posts set ${fields.join(", ")} where id = ?`, updateArgs);
  }

  return getPostById(postId);
}

export async function updatePostImages(postId: string, images: string[]): Promise<Post | null> {
  await replaceImages(postId, images);
  return getPostById(postId);
}

export async function getMoodEntries(): Promise<MoodEntry[]> {
  await ensureMoodTable();
  const { rows } = await client.execute(
    "select date, mood, intensity, note from mood_entries order by date desc",
  );
  return (rows as unknown as { date: string; mood: MoodEntry["mood"]; intensity: number; note: string }[]).map(
    (row) => ({
      date: row.date,
      mood: row.mood,
      intensity: Math.min(3, Math.max(1, Number(row.intensity))) as 1 | 2 | 3,
      note: row.note ?? "",
    }),
  );
}

export async function upsertMoodEntry(entry: MoodEntry) {
  await ensureMoodTable();
  await client.execute({
    sql: "insert into mood_entries (id, date, mood, intensity, note, created_at) values (?, ?, ?, ?, ?, datetime('now')) on conflict(date) do update set mood=excluded.mood, intensity=excluded.intensity, note=excluded.note",
    args: [entry.date, entry.date, entry.mood, entry.intensity, entry.note ?? ""],
  });
  return entry;
}
