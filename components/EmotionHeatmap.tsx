"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type Mood = "joy" | "anger" | "calm" | "fatigue" | "sadness";

type EmotionEntry = {
  date: string; // yyyy-mm-dd
  mood: Mood;
  intensity: 1 | 2 | 3;
  note?: string;
};

type EmotionHeatmapProps = {
  initialEntries: EmotionEntry[];
  diaryLinks: Record<string, { url: string; title: string }>;
};

const moodPalette: Record<Mood, { label: string; h: number; s: number; l: number }> = {
  joy: { label: "Joy", h: 38, s: 95, l: 65 },
  calm: { label: "Calm", h: 135, s: 28, l: 64 },
  sadness: { label: "Sad", h: 205, s: 45, l: 72 },
  anger: { label: "Anger", h: 355, s: 70, l: 68 },
  fatigue: { label: "Fatigue", h: 260, s: 32, l: 70 },
};

const yearsOptions = (current: number) => [current - 2, current - 1, current];

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function colorFor(mood: Mood, level: 1 | 2 | 3) {
  const { h, s, l } = moodPalette[mood];
  const lightness = level === 1 ? l + 8 : level === 2 ? l : l - 8;
  const sat = s - (level === 1 ? 6 : level === 2 ? 2 : 0);
  return `hsl(${h}, ${sat}%, ${lightness}%)`;
}

function glowFor(mood: Mood) {
  const { h, s, l } = moodPalette[mood];
  const glowLightness = Math.max(0, l - 12);
  return `0 0 6px 2px hsla(${h}, ${s}%, ${glowLightness}%, 0.55)`;
}

function buildWeekColumns(year: number): (string | null)[][] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  const firstWeekStart = new Date(start);
  while (firstWeekStart.getDay() !== 1) {
    firstWeekStart.setDate(firstWeekStart.getDate() - 1);
  }
  const lastWeekEnd = new Date(end);
  while (lastWeekEnd.getDay() !== 0) {
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 1);
  }

  const weeks: (string | null)[][] = [];
  for (let d = new Date(firstWeekStart); d <= lastWeekEnd; d.setDate(d.getDate() + 1)) {
    const diffDays = Math.floor((d.getTime() - firstWeekStart.getTime()) / 86400000);
    const weekIdx = Math.floor(diffDays / 7);
    if (!weeks[weekIdx]) weeks[weekIdx] = Array(7).fill(null);
    const dayOfWeek = d.getDay(); // 0 Sunday
    const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday top, Sunday bottom
    weeks[weekIdx][row] = d.getFullYear() === year ? formatDateKey(d) : null;
  }
  return weeks;
}

export default function EmotionHeatmap({ initialEntries, diaryLinks }: EmotionHeatmapProps) {
  const [entries, setEntries] = useState<Record<string, EmotionEntry>>(
    () =>
      initialEntries.reduce(
        (acc, entry) => {
          acc[entry.date] = entry;
          return acc;
        },
        {} as Record<string, EmotionEntry>,
      ),
  );
  const [tooltipContent, setTooltipContent] = useState<null | { date: string; entry?: EmotionEntry }>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [modal, setModal] = useState<null | { date: string; entry?: EmotionEntry }>(null);
  const [mounted, setMounted] = useState(false);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const weeks = useMemo(() => buildWeekColumns(year), [year]);

  const diaryForDate = (date: string) => diaryLinks[date];

  const updateTooltipPosition = (x: number, y: number) => {
    tooltipPos.current = { x, y };
    setTooltipPosition({ x, y });
    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${x + 12}px`;
      tooltipRef.current.style.top = `${y + 12}px`;
    }
  };

  useEffect(() => {
    if (tooltipContent && tooltipRef.current) {
      const { x, y } = tooltipPos.current;
      tooltipRef.current.style.left = `${x + 12}px`;
      tooltipRef.current.style.top = `${y + 12}px`;
    }
  }, [tooltipContent]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async (date: string, payload: Partial<EmotionEntry>) => {
    setEntries((prev) => ({
      ...prev,
      [date]: {
        date,
        mood: (payload.mood ?? prev[date]?.mood ?? "joy") as Mood,
        intensity: (payload.intensity ?? prev[date]?.intensity ?? 2) as 1 | 2 | 3,
        note: payload.note ?? prev[date]?.note ?? "",
      },
    }));
    try {
      await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mood: (payload.mood ?? entries[date]?.mood ?? "joy") as Mood,
          intensity: (payload.intensity ?? entries[date]?.intensity ?? 2) as 1 | 2 | 3,
          note: payload.note ?? entries[date]?.note ?? "",
        }),
      });
    } catch (err) {
      console.error("Failed to persist mood entry", err);
    }
    setModal(null);
  };

  const clearTooltipIfOutside = (next: EventTarget | null) => {
    const n = next instanceof Node ? next : null;
    if (tooltipRef.current && n && tooltipRef.current.contains(n)) return;
    setTooltipContent(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-ink/60">Mood tracker</p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div
            className="relative flex items-center gap-3 rounded-full border border-ink/10 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
            onWheel={(e) => {
              e.preventDefault();
              const opts = yearsOptions(currentYear);
              const idx = opts.indexOf(year);
              const nextIdx = e.deltaY > 0 ? Math.min(opts.length - 1, idx + 1) : Math.max(0, idx - 1);
              setYear(opts[nextIdx]);
            }}
          >
            <div className="flex items-center gap-4 text-[13px] font-heading tracking-[0.18em]" style={{ color: "#7a6756" }}>
              {yearsOptions(currentYear).map((y) => {
                const active = y === year;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`transition ${active ? "text-[#4a3b2c] drop-shadow-sm" : "text-[#b9afa3] hover:text-[#6b5a48]"}`}
                    style={{ transform: active ? "scale(1.08)" : "scale(0.95)" }}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          </div>
          {(Object.keys(moodPalette) as Mood[]).map((mood) => (
            <div
              key={mood}
              className="flex items-center gap-1 rounded-full border border-ink/10 bg-white/60 px-2 py-1 shadow-sm backdrop-blur"
            >
              {[1, 2, 3].map((lvl) => (
                <span
                  key={lvl}
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colorFor(mood, lvl as 1 | 2 | 3) }}
                  title={`${moodPalette[mood].label} ${lvl}`}
                />
              ))}
              <span className="uppercase tracking-[0.25em] text-ink/60">{moodPalette[mood].label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-auto rounded-[32px] border border-white/40 bg-white/30 p-5 shadow-[0_30px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl no-scrollbar">
        <div
          ref={gridRef}
          className="grid grid-flow-col gap-[3px]"
          onMouseLeave={(e) => clearTooltipIfOutside(e.relatedTarget)}
        >
          {weeks.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-[3px]">
              {week.map((date, rowIdx) => {
                const hasDate = !!date;
                const entry = hasDate ? entries[date] : undefined;
                const diary = hasDate ? diaryForDate(date!) : undefined;
                const moodColor = entry ? colorFor(entry.mood, entry.intensity) : "rgba(0,0,0,0.04)";
                const delay = (colIdx * 7 + rowIdx) * 4;
                const isIntense = entry && entry.intensity === 3;
                const baseShadow = "0 4px 12px rgba(0,0,0,0.08), inset 1px 1px 2px rgba(255,255,255,0.45)";
                const glowShadow = isIntense ? glowFor(entry.mood) : "";
                const combinedShadow = isIntense ? `${glowShadow}, ${baseShadow}` : baseShadow;
                return (
                  <button
                    key={date ?? `empty-${colIdx}-${rowIdx}`}
                    type="button"
                    className={`group relative h-[14px] w-[14px] rounded-full transition-all duration-200 hover:scale-[1.35] focus:outline-none wave-reveal mood-cell ${
                      entry ? "has-entry" : ""
                    } ${!hasDate ? "opacity-30" : ""}`}
                    style={
                      {
                        backgroundColor: moodColor,
                        backgroundImage: undefined,
                        backgroundBlendMode: undefined,
                        animationDelay: `${delay}ms`,
                        opacity: entry ? 1 : hasDate ? 0.9 : 0.25,
                        cursor: hasDate ? "pointer" : "default",
                        "--mood-shadow": entry ? combinedShadow : "inset 0 0 0 rgba(255,255,255,0.2)",
                      } as CSSProperties
                    }
                    aria-label={date ?? undefined}
                    disabled={!hasDate}
                    onMouseEnter={(e) => {
                      if (!hasDate) return;
                      updateTooltipPosition(e.clientX, e.clientY);
                      setTooltipContent({ date: date!, entry });
                    }}
                    onMouseMove={(e) => {
                      if (tooltipContent && hasDate) {
                        updateTooltipPosition(e.clientX, e.clientY);
                      }
                    }}
                    onClick={() => hasDate && setModal({ date: date!, entry })}
                  >
                    {diary && (
                      <span className="pointer-events-none absolute bottom-[-4px] right-[-4px] text-[8px] text-ink/70 drop-shadow">
                        ↗
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {mounted &&
        tooltipContent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            data-mood-tooltip
            className="fixed z-[9999] w-64 rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink shadow-[0_12px_28px_rgba(0,0,0,0.12)] pointer-events-none transition-opacity duration-150 ease-out"
            style={{
              willChange: "opacity",
              left: `${tooltipPosition.x + 12}px`,
              top: `${tooltipPosition.y + 12}px`,
              opacity: 1,
              transform: "translateY(0) scale(1)",
              transitionDelay: "40ms",
              pointerEvents: "none",
            }}
            aria-hidden={!tooltipContent}
            onMouseLeave={(e) => {
              const n = e.relatedTarget instanceof Node ? e.relatedTarget : null;
              if (gridRef.current && n && gridRef.current.contains(n)) return;
              setTooltipContent(null);
            }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{tooltipContent.date}</p>
            <p className="mt-1 font-semibold text-ink">
              {moodPalette[tooltipContent.entry?.mood ?? "joy"].label}
            </p>
            {tooltipContent.entry && diaryForDate(tooltipContent.date) && (
              <a
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-ink hover:text-blush"
                href={diaryForDate(tooltipContent.date)!.url}
              >
                {`${diaryForDate(tooltipContent.date)!.title} ↗`}
              </a>
            )}
          </div>,
          document.body,
        )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(240,238,232,0.6)] backdrop-blur-lg md:items-center">
          <div className="relative w-full max-w-md translate-y-4 rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-transform duration-300 ease-out md:translate-y-0">
            <button
              type="button"
              className="absolute right-4 top-4 text-sm text-ink/50 hover:text-ink"
              onClick={() => setModal(null)}
            >
              x
            </button>
            <p className="text-xs uppercase tracking-[0.3em] text-ink/60">{modal.date}</p>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-3xl p-3">
                {(Object.keys(moodPalette) as Mood[]).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() =>
                      setModal((prev) =>
                        prev
                          ? { ...prev, entry: { ...(prev.entry ?? { date: modal.date, intensity: 2 as 1 | 2 | 3, mood }), mood } }
                          : prev,
                      )
                    }
                    className={`h-10 w-10 rounded-full transition ${
                      modal.entry?.mood === mood
                        ? "scale-110 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                        : "border border-ink/10 shadow-sm"
                    }`}
                    style={{
                      background: colorFor(mood, 2 as 1 | 2 | 3),
                      borderColor: modal.entry?.mood === mood ? "transparent" : undefined,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.25em] text-ink/60">Shade</span>
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      setModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              entry: { ...(prev.entry ?? { date: modal.date, mood: "joy", intensity: lvl as 1 | 2 | 3 }), intensity: lvl as 1 | 2 | 3 },
                            }
                          : prev,
                      )
                    }
                    className={`rounded-full border text-sm font-semibold transition ${
                      modal.entry?.intensity === lvl
                        ? "border-white shadow-lg bg-white/20"
                        : lvl === 3
                          ? "border-white/70 shadow-[0_0_0_2px_rgba(255,255,255,0.5)]"
                          : "border-ink/20 shadow-sm"
                    }`}
                    style={{
                      background: modal.entry?.mood ? colorFor(modal.entry.mood, lvl as 1 | 2 | 3) : "#f0efe9",
                      height: `${18 + lvl * 6}px`,
                      width: `${18 + lvl * 6}px`,
                    }}
                  />
                ))}
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-ink/60">Note</label>
                <textarea
                  value={modal.entry?.note ?? ""}
                  onChange={(e) =>
                    setModal((prev) =>
                      prev
                        ? { ...prev, entry: { ...(prev.entry ?? { date: modal.date, mood: "joy", intensity: 2 as 1 | 2 | 3 }), note: e.target.value } }
                        : prev,
                    )
                  }
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-ink outline-none backdrop-blur focus:border-blush"
                  placeholder="Capture how you felt today..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-white/50 bg-white/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/80 active:translate-y-0"
                  onClick={() => handleSave(modal.date, modal.entry ?? { date: modal.date, mood: "joy", intensity: 2 })}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/40 bg-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink/70 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:text-ink"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                {diaryForDate(modal.date) && (
                  <a
                    href={diaryForDate(modal.date)!.url}
                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-ink hover:text-blush"
                  >
                    {"Diary ↗"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



