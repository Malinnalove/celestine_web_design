import client from "@/lib/db";

type PostBody = {
  title?: string;
  content?: string;
};

export async function GET() {
  const { rows } = await client.execute(
    "select id, title, content, created_at from posts order by created_at desc",
  );

  return Response.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as PostBody;
  const title = body.title?.trim();
  const content = body.content ?? "";

  if (!title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const createdAt = new Date().toISOString();

  await client.execute({
    sql: "insert into posts (title, content, created_at) values (?, ?, ?)",
    args: [title, content, createdAt],
  });

  return Response.json({ ok: true, createdAt });
}
