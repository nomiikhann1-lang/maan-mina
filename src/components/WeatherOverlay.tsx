import type { WeatherCondition } from "@/lib/weather";

export function WeatherOverlay({ condition }: { condition: WeatherCondition | null }) {
  if (!condition) return null;

  if (condition === "rain") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-[-10%] w-px bg-sky-400/70"
            style={{
              left: `${(i * 37) % 100}%`,
              height: `${16 + (i % 5) * 6}px`,
              animation: `rain-fall ${0.7 + (i % 4) * 0.15}s linear ${(i % 10) * 0.12}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (condition === "snow") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-[-5%] rounded-full bg-white"
            style={{
              left: `${(i * 43) % 100}%`,
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              animation: `snow-fall ${5 + (i % 5)}s linear ${(i % 10) * 0.4}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  if (condition === "clear") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 85% 8%, rgba(255,220,120,0.9) 0%, transparent 45%), " +
            "repeating-conic-gradient(from 0deg at 85% 8%, rgba(255,220,120,0.25) 0deg 6deg, transparent 6deg 18deg)",
        }}
      />
    );
  }

  if (condition === "clouds" || condition === "mist") {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
        <div
          className="drift absolute -top-10 left-[-20%] h-40 w-[70%] rounded-full bg-white/70 blur-2xl"
          style={{ animationDuration: "22s" }}
        />
        <div
          className="drift absolute top-1/3 left-[30%] h-32 w-[60%] rounded-full bg-white/60 blur-2xl"
          style={{ animationDuration: "26s", animationDelay: "-8s" }}
        />
      </div>
    );
  }

  return null;
}
