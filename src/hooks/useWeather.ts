import { useEffect, useState } from "react";
import { fetchWeather, type WeatherReading } from "@/lib/weather";

const REFRESH_MS = 20 * 60 * 1000; // 20 minutes — keeps day/night and conditions current
const cache = new Map<string, WeatherReading | null>();

export function useWeather(email: string | null | undefined): WeatherReading | null {
  const key = (email ?? "").trim().toLowerCase();
  const [weather, setWeather] = useState<WeatherReading | null>(cache.get(key) ?? null);

  useEffect(() => {
    if (!key) return;
    let active = true;

    async function load() {
      const reading = await fetchWeather(email);
      cache.set(key, reading);
      if (active) setWeather(reading);
    }

    void load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [key, email]);

  return weather;
}
