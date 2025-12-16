import { NextResponse } from "next/server";
import { getMoodEntries, upsertMoodEntry } from "@/lib/data";

export async function GET() {
  const entries = await getMoodEntries();
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, mood, intensity, note } = body ?? {};
    if (!date || !mood || !intensity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const normalized = {
      date: String(date),
      mood: mood as "joy" | "anger" | "calm" | "fatigue" | "sadness",
      intensity: Number(intensity) as 1 | 2 | 3,
      note: typeof note === "string" ? note : "",
    };
    await upsertMoodEntry(normalized);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to save mood entry", err);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
