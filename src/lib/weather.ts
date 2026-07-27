export type WeatherCondition = "rain" | "snow" | "clear" | "clouds" | "mist" | "windy";

export const WEATHER_LABEL: Record<WeatherCondition, string> = {
  rain: "rainy",
  snow: "snowy",
  clear: "sunny",
  clouds: "cloudy",
  mist: "misty",
  windy: "windy",
};

export type WeatherReading = {
  condition: WeatherCondition;
  tempC: number;
  city: string;
  isDay: boolean;
};

/**
 * Fixed home locations — no geolocation, no API key. Coordinates are my
 * best estimate for these specific neighborhoods (not a live geocoding
 * lookup), so they're close but not necessarily pinpoint-exact — close
 * enough to reflect real local conditions rather than a city-wide average.
 */
const CITY_BY_EMAIL: Record<string, { name: string; lat: number; lon: number }> = {
  "maan@chat.com": { name: "Bin Qasim Town, Karachi", lat: 24.7736, lon: 67.3406 },
  "mina@chat.com": { name: "DHA, Islamabad", lat: 33.5651, lon: 73.1131 },
};

function mapWeatherCode(code: number, windKph: number): WeatherCondition {
  if (windKph >= 30) return "windy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code))
    return "rain";
  if ([45, 48].includes(code)) return "mist";
  if (code === 0) return "clear";
  return "clouds";
}

export function cityForEmail(email: string | null | undefined) {
  if (!email) return null;
  return CITY_BY_EMAIL[email.trim().toLowerCase()] ?? null;
}

/**
 * Open-Meteo — free, no API key, no signup. Returns null on any failure;
 * this is pure ambiance, so it should never surface an error to the user.
 */
export async function fetchWeather(
  email: string | null | undefined,
): Promise<WeatherReading | null> {
  const city = cityForEmail(email);
  if (!city) return null;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.current?.weather_code;
    const tempC = data?.current?.temperature_2m;
    const windKph = data?.current?.wind_speed_10m ?? 0;
    const isDay = data?.current?.is_day !== 0;
    if (typeof code !== "number" || typeof tempC !== "number") return null;
    return { condition: mapWeatherCode(code, windKph), tempC, city: city.name, isDay };
  } catch {
    return null;
  }
}
