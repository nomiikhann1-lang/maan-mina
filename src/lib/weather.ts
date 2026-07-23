export type WeatherCondition = "rain" | "snow" | "clear" | "clouds" | "mist";

export const WEATHER_LABEL: Record<WeatherCondition, string> = {
  rain: "rainy",
  snow: "snowy",
  clear: "sunny",
  clouds: "cloudy",
  mist: "misty",
};

export const WEATHER_EMOJI: Record<WeatherCondition, string> = {
  rain: "🌧️",
  snow: "❄️",
  clear: "☀️",
  clouds: "☁️",
  mist: "🌫️",
};

export type WeatherReading = { condition: WeatherCondition; tempC: number; emoji: string };

function mapCondition(main: string): WeatherCondition {
  const m = main.toLowerCase();
  if (m.includes("rain") || m.includes("drizzle") || m.includes("thunderstorm")) return "rain";
  if (m.includes("snow")) return "snow";
  if (m.includes("cloud")) return "clouds";
  if (m.includes("mist") || m.includes("fog") || m.includes("haze")) return "mist";
  return "clear";
}

/**
 * Fetches current weather for a lat/lon via OpenWeatherMap. Returns null on
 * any failure (missing key, network error, permission issue) — this is a
 * pure ambiance feature, so it should never surface an error to the user,
 * just silently not render anything.
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherReading | null> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const main = data?.weather?.[0]?.main;
    const tempC = data?.main?.temp;
    if (typeof main !== "string" || typeof tempC !== "number") return null;
    const condition = mapCondition(main);
    return { condition, tempC, emoji: WEATHER_EMOJI[condition] };
  } catch {
    return null;
  }
}
