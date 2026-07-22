import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/home" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* soft petal backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="drift absolute -top-10 -left-10 text-8xl opacity-30">🌻</div>
        <div
          className="drift absolute top-1/3 -right-6 text-6xl opacity-25"
          style={{ animationDelay: "-4s" }}
        >
          🌼
        </div>
        <div className="float-slow absolute bottom-10 left-6 text-5xl opacity-30">🌸</div>
        <div
          className="float-slow absolute bottom-32 right-10 text-4xl opacity-25"
          style={{ animationDelay: "-2s" }}
        >
          ☁️
        </div>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="bloom mb-3 text-6xl">🌻</div>
          <h1 className="font-display text-4xl font-semibold text-foreground">Maan &amp; Mina</h1>
          <p className="mt-2 text-sm text-muted-foreground">Every message blooms with love</p>
        </div>

        <div className="w-full rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft backdrop-blur pop-in">
          <div className="mb-5 flex rounded-full bg-secondary p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full px-4 py-2 transition-all ${mode === "signin" ? "bg-primary text-primary-foreground shadow-petal" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-4 py-2 transition-all ${mode === "signup" ? "bg-primary text-primary-foreground shadow-petal" : "text-muted-foreground"}`}
            >
              Join
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Your name">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Maan or Mina"
                  className="input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sunflower.cafe"
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 6 characters"
                className="input"
              />
            </Field>

            {error && (
              <div className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-petal transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-60"
            >
              {loading ? "…" : mode === "signup" ? "Bloom my account 🌻" : "Come on in"}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-6 text-xs text-muted-foreground hover:text-foreground">
          ← back
        </Link>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          background: var(--color-secondary);
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          color: var(--color-foreground);
          outline: none;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }
        .input:focus { border-color: var(--color-ring); background: var(--color-card); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
