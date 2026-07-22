import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeId = "light" | "dark" | "pink" | "blue" | "forest" | "galaxy" | "minimal";

type CoupleSettings = {
  anniversary_date: string | null;
  countdown_date: string | null;
  countdown_label: string | null;
  theme: ThemeId;
};

type Ctx = {
  settings: CoupleSettings;
  loaded: boolean;
  setAnniversaryDate: (date: string | null) => Promise<void>;
  setCountdown: (date: string | null, label: string | null) => Promise<void>;
  setTheme: (theme: ThemeId) => Promise<void>;
};

const DEFAULTS: CoupleSettings = {
  anniversary_date: null,
  countdown_date: null,
  countdown_label: null,
  theme: "light",
};

const CoupleSettingsContext = createContext<Ctx>({
  settings: DEFAULTS,
  loaded: false,
  setAnniversaryDate: async () => {},
  setCountdown: async () => {},
  setTheme: async () => {},
});

export function CoupleSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CoupleSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("couple_settings")
        .select("anniversary_date, countdown_date, countdown_label, theme")
        .eq("id", 1)
        .maybeSingle();
      if (active && data) setSettings(data as CoupleSettings);
      if (active) setLoaded(true);
    })();

    const channel = supabase
      .channel("couple-settings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couple_settings" },
        (payload) => {
          setSettings(payload.new as CoupleSettings);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  async function setAnniversaryDate(date: string | null) {
    setSettings((s) => ({ ...s, anniversary_date: date }));
    await supabase.from("couple_settings").update({ anniversary_date: date }).eq("id", 1);
  }

  async function setCountdown(date: string | null, label: string | null) {
    setSettings((s) => ({ ...s, countdown_date: date, countdown_label: label }));
    await supabase
      .from("couple_settings")
      .update({ countdown_date: date, countdown_label: label })
      .eq("id", 1);
  }

  async function setTheme(theme: ThemeId) {
    setSettings((s) => ({ ...s, theme }));
    await supabase.from("couple_settings").update({ theme }).eq("id", 1);
  }

  return (
    <CoupleSettingsContext.Provider
      value={{ settings, loaded, setAnniversaryDate, setCountdown, setTheme }}
    >
      {children}
    </CoupleSettingsContext.Provider>
  );
}

export function useCoupleSettings() {
  return useContext(CoupleSettingsContext);
}
