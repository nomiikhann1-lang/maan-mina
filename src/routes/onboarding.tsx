import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  component: OnboardingPage,
});

const SLIDES = [
  {
    emoji: "🌻",
    title: "Welcome to Maan & Mina",
    body: "A private little corner of the internet, made for just the two of you.",
  },
  {
    emoji: "💬",
    title: "Say it your way",
    body: "Text, photos, voice notes, stickers, reactions — everything a real conversation needs.",
  },
  {
    emoji: "🔒",
    title: "Just for two",
    body: "No public sign-ups, no strangers. This space only ever belongs to the two of you.",
  },
];

function markOnboardingSeen() {
  try {
    localStorage.setItem("onboarding_seen", "1");
  } catch {
    // localStorage unavailable (private mode etc.) — not critical, just re-shows next time
  }
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function finish() {
    markOnboardingSeen();
    navigate({ to: "/auth" });
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="drift absolute -top-10 -left-10 text-8xl opacity-25">🌻</div>
        <div
          className="drift absolute top-1/3 -right-8 text-6xl opacity-20"
          style={{ animationDelay: "-4s" }}
        >
          🌼
        </div>
        <div className="float-slow absolute bottom-28 left-8 text-5xl opacity-20">🌸</div>
      </div>

      <button
        onClick={finish}
        className="relative z-10 self-end px-5 pt-6 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Skip
      </button>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div key={step} className="bloom mb-6 text-8xl">
          {slide.emoji}
        </div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{slide.title}</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{slide.body}</p>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>

      <div className="relative z-10 px-6 pb-10">
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-petal transition-transform hover:scale-[1.02] active:scale-100"
        >
          {isLast ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}
