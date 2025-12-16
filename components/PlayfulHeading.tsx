 "use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PlayfulHeadingProps = {
  text: string;
  className?: string;
};

type LetterState = {
  color?: string;
  transform?: string;
  wiggle?: boolean;
};

// Per-letter playful hover inspired by Coolors palette shuffles.
export default function PlayfulHeading({ text, className = "" }: PlayfulHeadingProps) {
  const palette = useMemo(
    () => ["#ff5c00", "#ff1f3d", "#fcbf49", "#06d6a0", "#118ab2", "#8338ec", "#ff2ec4"],
    [],
  );

  const [states, setStates] = useState<LetterState[]>(() => Array.from({ length: text.length }, () => ({})));
  const timersRef = useRef<Record<number, number[]>>({});
  const lastHitRef = useRef<Record<number, number>>({});

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).flat().forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const hitLetter = (idx: number) => {
    const now = performance.now();
    const last = lastHitRef.current[idx] ?? 0;
    if (now - last < 50) return; // allow rapid move to still trigger but avoid flooding
    lastHitRef.current[idx] = now;

    // clear existing timers for this letter so it can retrigger while moving fast
    (timersRef.current[idx] || []).forEach((id) => window.clearTimeout(id));
    timersRef.current[idx] = [];

    const color = palette[Math.floor(Math.random() * palette.length)];
    const dx = (Math.random() - 0.5) * 22;
    const dy = (Math.random() - 0.5) * 22;
    const rot = (Math.random() - 0.5) * 24;

    setStates((prev) => {
      const next = [...prev];
      next[idx] = {
        color,
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(1.18)`,
        wiggle: true,
      };
      return next;
    });

    const timerId = window.setTimeout(() => {
      setStates((prev) => {
        const next = [...prev];
        next[idx] = {};
        return next;
      });
    }, 4000);

    if (!timersRef.current[idx]) timersRef.current[idx] = [];
    timersRef.current[idx].push(timerId);

    const wiggleStopId = window.setTimeout(() => {
      setStates((prev) => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], wiggle: false };
        return next;
      });
    }, 650);

    timersRef.current[idx].push(wiggleStopId);
  };

  return (
    <>
      <h1 className={className}>
        {text.split("").map((char, idx) => {
          const state = states[idx] || {};
          const isSpace = char === " ";
          return (
            <span
              key={`${char}-${idx}`}
              onMouseEnter={() => !isSpace && hitLetter(idx)}
              onMouseMove={() => !isSpace && hitLetter(idx)}
              className="inline-block align-baseline px-[2px]"
              style={{
                color: state.color,
                transform: state.transform,
              transition: "transform 180ms ease, color 180ms ease",
              animation: state.wiggle ? "playful-wiggle 0.45s ease-out" : undefined,
              // Preserve base transform for the keyframes
              ["--baseTransform" as string]: state.transform || "none",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
      </h1>
      <style jsx>{`
        @keyframes playful-wiggle {
          0% {
            transform: var(--baseTransform);
          }
          25% {
            transform: var(--baseTransform) translate(6px, -4px) rotate(6deg);
          }
          55% {
            transform: var(--baseTransform) translate(-5px, 5px) rotate(-5deg);
          }
          80% {
            transform: var(--baseTransform) translate(3px, -2px) rotate(3deg);
          }
          100% {
            transform: var(--baseTransform);
          }
        }
      `}</style>
    </>
  );
}
