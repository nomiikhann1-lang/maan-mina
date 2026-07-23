import { useEffect, useState } from "react";
import { fetchWeather, type WeatherReading } from "@/lib/weather";

let cache: WeatherReading | null | undefined;

export function useWeather(): WeatherReading | null {
  const [weather, setWeather] = useState<WeatherReading | null>(cache ?? null);

  useEffect(() => {
    if (cache !== undefined) return;
    if (!("geolocation" in navigator)) {
      cache = null;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const reading = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
        cache = reading;
        setWeather(reading);
      },
      () => {
        cache = null;
      },
      { timeout: 8000, maximumAge: 1000 * 60 * 30 },
    );
  }, []);

  return weather;
}
