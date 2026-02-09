"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";

type Mood = "joy" | "anger" | "calm" | "fatigue" | "sadness";

type DiaryLink = { url: string; title: string };

type EmotionEntry = {
  date: string; // yyyy-mm-dd
  mood: Mood;
  intensity: 1 | 2 | 3;
  note?: string;
};

type EmotionHeatmapProps = {
  initialEntries: EmotionEntry[];
  diaryLinks: Record<string, DiaryLink>;
};

type TooltipContent = { date: string; entry?: EmotionEntry; diary?: DiaryLink };

const moodPalette: Record<Mood, { label: string; h: number; s: number; l: number }> = {
  joy: { label: "Joy", h: 38, s: 95, l: 65 },
  calm: { label: "Calm", h: 135, s: 28, l: 64 },
  sadness: { label: "Sad", h: 205, s: 45, l: 72 },
  anger: { label: "Anger", h: 355, s: 70, l: 68 },
  fatigue: { label: "Fatigue", h: 260, s: 32, l: 70 },
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function glowFilterFor(mood: Mood) {
  const { h, s, l } = moodPalette[mood];
  const glowLightness = Math.max(0, l - 12);
  return `drop-shadow(0 0 6px hsla(${h}, ${s}%, ${glowLightness}%, 0.6))`;
}

function maskFor(mood: Mood) {
  switch (mood) {
    case "joy":
      return 'url("/flower.png")';
    case "calm":
      return 'url("/grass.png")';
    case "fatigue":
      return 'url("/rock.png")';
    case "anger":
      return 'url("/flash.png")';
    case "sadness":
      return 'url("/waterdrop.png")';
    default:
      return 'url("/flower.png")';
  }
}

function hashFor(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function jitterFor(seed: string) {
  const hash = hashFor(seed);

  const xByte = hash & 0xff;
  const yByte = (hash >> 8) & 0xff;
  const xUnit = (xByte / 255) * 2 - 1; // -1..1
  const yUnit = (yByte / 255) * 2 - 1;

  // Subtle chaos; the icon itself is larger than the layout step.
  const amplitude = 2.2;
  return {
    x: xUnit * amplitude,
    y: yUnit * amplitude,
  };
}

function buildWeekColumns(year: number): (string | null)[][] {
  const start = new Date(year, 0, 1, 12);
  const end = new Date(year, 11, 31, 12);

  const firstWeekStart = new Date(start);
  while (firstWeekStart.getDay() !== 1) {
    firstWeekStart.setDate(firstWeekStart.getDate() - 1);
  }
  const lastWeekEnd = new Date(end);
  while (lastWeekEnd.getDay() !== 0) {
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 1);
  }

  const weeks: (string | null)[][] = [];
  let dayIndex = 0;
  for (let d = new Date(firstWeekStart); d <= lastWeekEnd; d.setDate(d.getDate() + 1), dayIndex++) {
    const weekIdx = Math.floor(dayIndex / 7);
    if (!weeks[weekIdx]) weeks[weekIdx] = Array(7).fill(null);
    const dayOfWeek = d.getDay(); // 0 Sunday
    const row = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday top, Sunday bottom
    weeks[weekIdx][row] = d.getFullYear() === year ? formatDateKey(d) : null;
  }
  return weeks;
}

type MoodGridProps = {
  weeks: (string | null)[][];
  entries: Record<string, EmotionEntry>;
  diaryLinks: Record<string, DiaryLink>;
  beastRevealDelayByDate: Record<string, number>;
  gridRef: RefObject<HTMLDivElement>;
  scheduleTooltipPosition: (x: number, y: number) => void;
  clearTooltipIfOutside: (next: EventTarget | null) => void;
  setTooltipContent: (next: TooltipContent | null) => void;
  openModal: (payload: { date: string; entry?: EmotionEntry }) => void;
};

const MoodGrid = memo(function MoodGrid({
  weeks,
  entries,
  diaryLinks,
  beastRevealDelayByDate,
  gridRef,
  scheduleTooltipPosition,
  clearTooltipIfOutside,
  setTooltipContent,
  openModal,
}: MoodGridProps) {
  return (
    <div className="mood-scroll relative overflow-auto rounded-[32px] border border-white/40 bg-white/30 p-5 shadow-[0_30px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl no-scrollbar">
      <div
        ref={gridRef}
        className="mood-grid grid grid-flow-col gap-[3px]"
        onMouseLeave={(e) => clearTooltipIfOutside(e.relatedTarget)}
        onMouseMove={(e) => scheduleTooltipPosition(e.clientX, e.clientY)}
      >
        {weeks.map((week, colIdx) => (
          <div key={colIdx} className="mood-column flex flex-col gap-[3px]">
            {week.map((date, rowIdx) => {
              const hasDate = !!date;
              const entry = hasDate ? entries[date] : undefined;
              const diary = hasDate ? diaryLinks[date!] : undefined;
              const moodColor = !hasDate ? "transparent" : entry ? colorFor(entry.mood, entry.intensity) : "rgba(0,0,0,0.04)";
              const waveDelay = (colIdx * 7 + rowIdx) * 4;
              const isIntense = entry && entry.intensity === 3;
              const baseShadow = "0 4px 12px rgba(0,0,0,0.08), inset 1px 1px 2px rgba(255,255,255,0.45)";
              const glowShadow = isIntense ? glowFor(entry.mood) : "";
              const combinedShadow = isIntense ? `${glowShadow}, ${baseShadow}` : baseShadow;
              const baseFilter = "drop-shadow(0 2px 3px rgba(0,0,0,0.22))";
              const combinedFilter = entry ? `${isIntense ? glowFilterFor(entry.mood) + " " : ""}${baseFilter}`.trim() : "none";
              const mask = entry ? maskFor(entry.mood) : 'url("/flower.png")';
              const jitter = hasDate ? jitterFor(date!) : { x: 0, y: 0 };
              const beastDelay = entry ? beastRevealDelayByDate[date!] ?? 0 : 0;

              return (
                <button
                  key={date ?? `empty-${colIdx}-${rowIdx}`}
                  type="button"
                  className={`group relative h-[14px] w-[14px] rounded-full transition-all duration-200 hover:scale-[1.35] focus:outline-none wave-reveal mood-cell ${
                    entry ? "has-entry" : ""
                  } ${!hasDate ? "opacity-30" : ""}`}
                  style={
                    {
                      opacity: entry ? 1 : hasDate ? 0.9 : 0,
                      cursor: hasDate ? "pointer" : "default",
                      "--wave-delay": `${waveDelay}ms`,
                      "--beast-delay": `${beastDelay}ms`,
                      "--mood-color": moodColor,
                      "--mood-mask": mask,
                      "--mood-jx": `${jitter.x.toFixed(2)}px`,
                      "--mood-jy": `${jitter.y.toFixed(2)}px`,
                      "--mood-shadow": entry ? combinedShadow : "inset 0 0 0 rgba(255,255,255,0.2)",
                      "--mood-filter": combinedFilter,
                    } as CSSProperties
                  }
                  aria-label={date ?? undefined}
                  disabled={!hasDate}
                  onMouseEnter={(e) => {
                    if (!hasDate) return;
                    scheduleTooltipPosition(e.clientX, e.clientY);
                    setTooltipContent({ date: date!, entry, diary });
                  }}
                  onClick={() => hasDate && openModal({ date: date!, entry })}
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
  );
});

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
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [modal, setModal] = useState<null | { date: string; entry?: EmotionEntry }>(null);
  const [mounted, setMounted] = useState(false);
  const [beastRevealSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    const addYear = (dateKey: string) => {
      const y = Number(dateKey.slice(0, 4));
      if (!Number.isNaN(y)) years.add(y);
    };
    Object.keys(entries).forEach(addYear);
    Object.keys(diaryLinks).forEach(addYear);
    years.add(currentYear);
    years.add(currentYear + 1);
    return Array.from(years).sort((a, b) => a - b);
  }, [currentYear, diaryLinks, entries]);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRaf = useRef<number | null>(null);

  const weeks = useMemo(() => buildWeekColumns(year), [year]);
  const beastRevealDelayByDate = useMemo(() => {
    const datesInGrid = weeks.flat().filter((date): date is string => Boolean(date));
    const datesWithEntries = datesInGrid.filter((date) => Boolean(entries[date]));
    if (datesWithEntries.length === 0) return {} as Record<string, number>;

    const keyed = datesWithEntries.map((date) => ({
      date,
      key: hashFor(`${beastRevealSeed}-${date}`),
    }));
    keyed.sort((a, b) => a.key - b.key);

    const totalWindowMs = 1400;
    const count = keyed.length;
    const rawStep = count <= 1 ? 0 : Math.round(totalWindowMs / (count - 1));
    const step = Math.max(8, Math.min(60, rawStep));

    const map: Record<string, number> = {};
    keyed.forEach(({ date }, index) => {
      map[date] = index * step;
    });
    return map;
  }, [beastRevealSeed, entries, weeks]);

  const scheduleTooltipPosition = useCallback((x: number, y: number) => {
    tooltipPos.current = { x, y };
    if (!tooltipRef.current) return;
    if (tooltipRaf.current !== null) return;
    tooltipRaf.current = window.requestAnimationFrame(() => {
      tooltipRaf.current = null;
      const el = tooltipRef.current;
      if (!el) return;
      const pos = tooltipPos.current;
      el.style.transform = `translate3d(${pos.x + 12}px, ${pos.y + 12}px, 0)`;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipRaf.current !== null) {
        window.cancelAnimationFrame(tooltipRaf.current);
        tooltipRaf.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!yearOptions.includes(year)) {
      setYear(yearOptions[yearOptions.length - 1] ?? currentYear);
    }
  }, [currentYear, year, yearOptions]);

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

  const clearTooltipIfOutside = useCallback((next: EventTarget | null) => {
    const n = next instanceof Node ? next : null;
    if (tooltipRef.current && n && tooltipRef.current.contains(n)) return;
    setTooltipContent(null);
  }, []);

  const openModal = useCallback((payload: { date: string; entry?: EmotionEntry }) => {
    setModal(payload);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-ink/60">Mood tracker</p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div
            className="relative flex items-center gap-3 rounded-full border border-ink/10 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
            onWheel={(e) => {
              e.preventDefault();
              const opts = yearOptions;
              const idxRaw = opts.indexOf(year);
              const idx = idxRaw === -1 ? 0 : idxRaw;
              const nextIdx = e.deltaY > 0 ? Math.min(opts.length - 1, idx + 1) : Math.max(0, idx - 1);
              setYear(opts[nextIdx]);
            }}
          >
            <div className="flex items-center gap-4 text-[13px] font-heading tracking-[0.18em]" style={{ color: "#7a6756" }}>
              {yearOptions.map((y) => {
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

      <MoodGrid
        weeks={weeks}
        entries={entries}
        diaryLinks={diaryLinks}
        beastRevealDelayByDate={beastRevealDelayByDate}
        gridRef={gridRef}
        scheduleTooltipPosition={scheduleTooltipPosition}
        clearTooltipIfOutside={clearTooltipIfOutside}
        setTooltipContent={setTooltipContent}
        openModal={openModal}
      />

      {mounted &&
        tooltipContent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
             ref={tooltipRef}
             data-mood-tooltip
             className="fixed z-[9999] w-64 rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink shadow-[0_12px_28px_rgba(0,0,0,0.12)] pointer-events-none transition-opacity duration-150 ease-out"
             style={{
               willChange: "transform, opacity",
               left: 0,
               top: 0,
               opacity: 1,
               transform: `translate3d(${tooltipPos.current.x + 12}px, ${tooltipPos.current.y + 12}px, 0)`,
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
            {tooltipContent.entry && <p className="mt-1 font-semibold text-ink">{moodPalette[tooltipContent.entry.mood].label}</p>}
            {tooltipContent.entry?.note?.trim() && (
              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-ink/80">
                {tooltipContent.entry.note}
              </p>
            )}
            {!tooltipContent.entry && !tooltipContent.diary && <p className="mt-2 text-xs text-ink/60">No record yet — click a day to add.</p>}
            {tooltipContent.diary && (
              <a
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.25em] text-ink hover:text-blush"
                href={tooltipContent.diary.url}
              >
                {`${tooltipContent.diary.title} ↗`}
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
                    className={`mood-choice relative h-10 w-10 rounded-full transition ${
                      modal.entry?.mood === mood
                        ? "is-active scale-110 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                        : "border border-ink/10 shadow-sm"
                    }`}
                    style={
                      {
                        background: colorFor(mood, 2 as 1 | 2 | 3),
                        borderColor: modal.entry?.mood === mood ? "transparent" : undefined,
                        "--mood-color": colorFor(mood, 2 as 1 | 2 | 3),
                        "--mood-mask": maskFor(mood),
                      } as CSSProperties
                    }
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.25em] text-ink/60">
                  {modal.entry?.mood ? moodPalette[modal.entry.mood].label : "Shade"}
                </span>
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
                    className={`shade-choice rounded-full border text-sm font-semibold transition ${
                      modal.entry?.intensity === lvl
                        ? "is-active border-white shadow-lg bg-white/20"
                        : lvl === 3
                          ? "border-white/70 shadow-[0_0_0_2px_rgba(255,255,255,0.5)]"
                          : "border-ink/20 shadow-sm"
                    }`}
                    style={{
                      background: modal.entry?.mood ? colorFor(modal.entry.mood, lvl as 1 | 2 | 3) : "#f0efe9",
                      height: `${18 + lvl * 6}px`,
                      width: `${18 + lvl * 6}px`,
                    }}
                    aria-pressed={modal.entry?.intensity === lvl}
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
                  className="mood-note mt-1 w-full rounded-2xl border border-white/60 bg-white/70 p-3 text-sm text-ink outline-none backdrop-blur"
                  placeholder="Capture how you felt today..."
                  style={
                    {
                      "--note-accent": modal.entry?.mood
                        ? colorFor(modal.entry.mood, modal.entry?.intensity ?? (2 as 1 | 2 | 3))
                        : "#f3a6c4",
                    } as CSSProperties
                  }
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
                {diaryLinks[modal.date] && (
                  <a
                    href={diaryLinks[modal.date]!.url}
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



