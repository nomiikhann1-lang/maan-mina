import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/bucket-list")({
  component: BucketListPage,
});

type BucketItem = {
  id: string;
  text: string;
  completed: boolean;
  added_by: string;
  completed_by: string | null;
  created_at: string;
};

function BucketListPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  async function refresh() {
    const { data } = await supabase
      .from("bucket_list_items")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as BucketItem[]) ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("bucket-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bucket_list_items" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setAdding(true);
    setText("");
    const { error } = await supabase
      .from("bucket_list_items")
      .insert({ added_by: user.id, text: trimmed });
    setAdding(false);
    if (error) setText(trimmed);
  }

  async function toggleComplete(item: BucketItem) {
    const completing = !item.completed;
    if (completing) {
      setJustCompletedId(item.id);
      window.setTimeout(() => setJustCompletedId((id) => (id === item.id ? null : id)), 700);
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, completed: completing } : i)));
    await supabase
      .from("bucket_list_items")
      .update({
        completed: completing,
        completed_by: completing ? user.id : null,
        completed_at: completing ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("bucket_list_items").delete().eq("id", id);
  }

  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <header className="flex items-center gap-3 border-b border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/home" })}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-transform hover:scale-110 hover:bg-secondary"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Our bucket list</h1>
      </header>

      <div className="mx-auto max-w-md px-5 py-6">
        <form onSubmit={addItem} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Something to do together…"
            maxLength={200}
            className="min-w-0 flex-1 rounded-full border border-transparent bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:bg-card"
          />
          <button
            type="submit"
            disabled={!text.trim() || adding}
            className="shrink-0 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-petal transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        {!loaded ? (
          <div className="py-10 text-center text-4xl">
            <span className="float-slow">🌻</span>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing on the list yet — add your first dream together.
          </p>
        ) : (
          <>
            {pending.length > 0 && (
              <ul className="mt-6 space-y-2">
                {pending.map((item) => (
                  <BucketRow
                    key={item.id}
                    item={item}
                    celebrating={justCompletedId === item.id}
                    onToggle={() => toggleComplete(item)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </ul>
            )}
            {done.length > 0 && (
              <div className="mt-8">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Done ({done.length})
                </div>
                <ul className="space-y-2">
                  {done.map((item) => (
                    <BucketRow
                      key={item.id}
                      item={item}
                      celebrating={false}
                      onToggle={() => toggleComplete(item)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BucketRow({
  item,
  celebrating,
  onToggle,
  onRemove,
}: {
  item: BucketItem;
  celebrating: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={`pop-in flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 ${
        celebrating ? "bloom" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={item.completed}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          item.completed ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {item.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span
        className={`min-w-0 flex-1 text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
      >
        {item.text}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
