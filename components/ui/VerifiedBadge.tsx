import React from "react";

// Pre-computed ray line endpoints — identical on server and client (no float drift)
const RAY_LINES = Array.from({ length: 20 }, (_, i) => {
  const a = (i * 18 * Math.PI) / 180;
  return {
    x2: (50 + 52 * Math.sin(a)).toFixed(3),
    y2: (50 - 52 * Math.cos(a)).toFixed(3),
  };
});

type VerifiedBadgeProps = { className?: string; withLabel?: boolean };

export default function VerifiedBadge({ className = "", withLabel = false }: VerifiedBadgeProps) {
  const uid = React.useId().replace(/:/g, "");
  const sg = `sg-${uid}`;
  const eg = `eg-${uid}`;
  const cl = `cl-${uid}`;

  // Sharp 8-pointed star: outer radius 46, inner radius 18
  // Outer at 0°,45°,90°... · Inner at 22.5°,67.5°...
  const starPts =
    "50,4 56.9,33.4 82.5,17.5 66.6,43.1 96,50 66.6,56.9 82.5,82.5 56.9,66.6 50,96 43.1,66.6 17.5,82.5 33.4,56.9 4,50 33.4,43.1 17.5,17.5 43.1,33.4";

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} title="WAC Verified">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className="shrink-0"
        style={{
          width: "1.25em",
          height: "1.25em",
          userSelect: "none",
          filter:
            "drop-shadow(0 0 4px rgba(200,150,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
        }}
      >
        <defs>
          {/* Star — matte gold, brighter top-left */}
          <linearGradient id={sg} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%"   stopColor="#F0D060" />
            <stop offset="30%"  stopColor="#D4A820" />
            <stop offset="60%"  stopColor="#A87808" />
            <stop offset="100%" stopColor="#6A4800" />
          </linearGradient>

          {/* Eagle — very dark so it reads clearly against gold */}
          <linearGradient id={eg} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%"   stopColor="#2C1A00" />
            <stop offset="100%" stopColor="#100800" />
          </linearGradient>

          <clipPath id={cl}>
            <polygon points={starPts} />
          </clipPath>
        </defs>

        {/* ── Star ──────────────────────────────────────────────────────── */}
        <polygon
          points={starPts}
          fill={`url(#${sg})`}
          stroke="#DDB830"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />

        {/* Subtle inner rim highlight */}
        <polygon
          points={starPts}
          fill="none"
          stroke="#F8E880"
          strokeWidth="0.5"
          strokeLinejoin="round"
          opacity="0.35"
          style={{ transform: "scale(0.88) translate(6px,6px)" }}
        />

        {/* Radiating line texture */}
        <g clipPath={`url(#${cl})`} opacity="0.10">
          {RAY_LINES.map(({ x2, y2 }, i) => (
            <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="#FFF5A0" strokeWidth="0.6" />
          ))}
        </g>

        {/* ── Albanian double-headed eagle ──────────────────────────────── */}
        {/*
          Silhouette goes clockwise from centre-neck top.
          Right beak tip → (74, 29)   Left beak tip → (26, 29)
          Right wing tip → (84, 43)   Left wing tip → (16, 43)
          Bottom centre  → (50, 72)
          Tailored so head bumps, wing spread, and leg spread all read
          clearly even at 16–20 px.
        */}
        <path
          fill={`url(#${eg})`}
          stroke="#1A0E00"
          strokeWidth="0.6"
          strokeLinejoin="round"
          d={`
            M 50,38
            L 54,34 L 58,28 L 64,23
            L 70,23 L 74,29 L 72,34
            L 75,31 L 73,37 L 68,39
            L 71,42 L 75,36 L 83,39
            L 84,43 L 82,50 L 74,50
            L 73,56 L 77,63 L 68,61
            L 62,67 L 58,73
            L 64,79 L 68,82 L 64,85
            L 56,80 L 52,74
            L 50,72
            L 48,74 L 44,80
            L 36,85 L 32,82 L 36,79 L 42,73
            L 38,67 L 32,61
            L 23,63 L 27,56 L 26,50 L 18,50
            L 16,43 L 17,39 L 25,36 L 29,42
            L 32,39 L 27,37 L 25,31
            L 28,34 L 26,29
            L 30,23 L 36,23
            L 42,28 L 46,34
            Z
          `}
        />

        {/* ── Eye dots — amber so they're visible on the dark eagle ────── */}
        <circle cx="69.5" cy="27" r="1.4" fill="#C89010" />
        <circle cx="30.5" cy="27" r="1.4" fill="#C89010" />
      </svg>

      {withLabel && (
        <span className="text-[10px] font-bold uppercase tracking-widest pt-[1px] text-[#C8A030]">
          Verified
        </span>
      )}
    </div>
  );
}
