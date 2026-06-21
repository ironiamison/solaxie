import { useMemo } from "react";

// Pure ambience. Renders only on the client (parent gates on `mounted`), so the
// randomized positions never cause hydration mismatches. Everything is
// pointer-events-none and GPU-cheap (CSS keyframes only).

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function Atmosphere() {
  const fireflies = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        left: rand(4, 96),
        top: rand(30, 88),
        size: rand(3, 6),
        driftDur: rand(7, 13),
        twinkleDur: rand(2.2, 4),
        delay: rand(0, 6),
      })),
    []
  );

  const motes = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left: rand(6, 94),
        top: rand(35, 90),
        size: rand(2, 4),
        dur: rand(3, 6),
        delay: rand(0, 5),
      })),
    []
  );

  // Purple crystals baked into the scene (cave + shrine) — make them twinkle.
  const crystals = [
    { left: 21, top: 27, size: 16 },
    { left: 26, top: 33, size: 12 },
    { left: 10, top: 52, size: 14 },
    { left: 16, top: 60, size: 11 },
    { left: 31, top: 24, size: 10 },
    { left: 8, top: 40, size: 12 },
  ];

  // Ambient ripples on open water (independent of the Axols).
  const ripples = [
    { left: 46, top: 56 },
    { left: 58, top: 70 },
    { left: 38, top: 72 },
    { left: 66, top: 52 },
  ];

  const butterflies = [
    { left: 64, top: 30, dur: 8, delay: 0, hue: "hue-rotate(0deg)" },
    { left: 24, top: 70, dur: 9.5, delay: 1.5, hue: "hue-rotate(60deg)" },
    { left: 78, top: 24, dur: 7, delay: 3, hue: "hue-rotate(290deg)" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* drifting cloud / fog band near the top */}
      <div
        className="absolute -inset-x-10 top-0 h-1/3 animate-cloud opacity-30"
        style={{ background: "radial-gradient(60% 80% at 30% 0%, rgba(150,120,255,0.18), transparent 70%)" }}
      />

      {/* moving water shimmer over the central pond */}
      <div
        className="absolute left-[28%] top-[44%] h-[34%] w-[44%] animate-watershimmer rounded-[50%] blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(120,230,255,0.35), rgba(80,200,255,0.12) 45%, transparent 72%)" }}
      />

      {/* ambient water ripples */}
      {ripples.map((r, i) => (
        <div key={`r${i}`} className="absolute" style={{ left: `${r.left}%`, top: `${r.top}%`, width: 56, height: 18 }}>
          <span className="absolute left-1/2 top-1/2 animate-ripple rounded-[50%] border border-cyan-100/40" style={{ width: "100%", height: "100%", animationDelay: `${i * 1.3}s` }} />
        </div>
      ))}

      {/* twinkling crystals */}
      {crystals.map((c, i) => (
        <span
          key={`c${i}`}
          className="absolute animate-twinkle rounded-full blur-[2px]"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            width: c.size,
            height: c.size,
            background: "radial-gradient(circle, #e6b3ff, #a64bff 60%, transparent 75%)",
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* fireflies */}
      {fireflies.map((f, i) => (
        <div
          key={`f${i}`}
          className="absolute animate-drift"
          style={{ left: `${f.left}%`, top: `${f.top}%`, animationDuration: `${f.driftDur}s`, animationDelay: `${f.delay}s` }}
        >
          <span
            className="block animate-twinkle rounded-full"
            style={{
              width: f.size,
              height: f.size,
              background: "radial-gradient(circle, #fff7c2, #ffe066 50%, rgba(255,200,60,0))",
              boxShadow: "0 0 8px 2px rgba(255,224,102,0.7)",
              animationDuration: `${f.twinkleDur}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        </div>
      ))}

      {/* drifting dust motes */}
      {motes.map((m, i) => (
        <span
          key={`m${i}`}
          className="absolute animate-sparkle rounded-full bg-white/80"
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }}
        />
      ))}

      {/* butterflies */}
      {butterflies.map((b, i) => (
        <div
          key={`b${i}`}
          className="absolute animate-flutter text-lg"
          style={{ left: `${b.left}%`, top: `${b.top}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`, filter: `${b.hue} drop-shadow(0 2px 3px rgba(0,0,0,0.4))` }}
        >
          <span className="relative inline-block h-3 w-4 opacity-80">
            <span className="absolute left-0 top-0 h-2 w-2 rounded-full bg-fuchsia-300/90" />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-violet-300/90" />
            <span className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-white/70" />
          </span>
        </div>
      ))}
    </div>
  );
}
