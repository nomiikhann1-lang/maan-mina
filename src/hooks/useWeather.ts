import { useEffect, useState } from "react";
import { fetchWeather, type WeatherReading } from "@/lib/weather";

const cache = new Map<string, WeatherReading | null>();

export function useWeather(email: string | null | undefined): WeatherReading | null {
  const key = (email ?? "").trim().toLowerCase();
  const [weather, setWeather] = useState<WeatherReading | null>(cache.get(key) ?? null);

  useEffect(() => {
    if (!key || cache.has(key)) return;
    let active = true;
    fetchWeather(email).then((reading) => {
      cache.set(key, reading);
      if (active) setWeather(reading);
    });
    return () => {
      active = false;
    };
  }, [key, email]);

  return weather;
}
