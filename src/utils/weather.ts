// Utility for fetching real-time weather using Geolocation and Open-Meteo API
// Free, open-access, no API keys required, works worldwide.

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity?: number;
  conditionText: string;
  conditionIcon: string;
  locationName: string;
  latitude: number;
  longitude: number;
  lastUpdated: number;
  isOfflineCached?: boolean;
}

// Convert Open-Meteo WMO weather codes to human-readable text and emoji
export function interpretWeatherCode(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: '☀️' };
  if (code === 1) return { text: 'Mainly Clear', icon: '🌤️' };
  if (code === 2) return { text: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { text: 'Overcast', icon: '☁️' };
  if (code >= 45 && code <= 48) return { text: 'Foggy / Mist', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { text: 'Drizzle', icon: '🌦️' };
  if (code >= 56 && code <= 57) return { text: 'Freezing Drizzle', icon: '🌨️' };
  if (code >= 61 && code <= 65) return { text: 'Rain Showers', icon: '🌧️' };
  if (code >= 66 && code <= 67) return { text: 'Freezing Rain', icon: '🌨️' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: '❄️' };
  if (code >= 80 && code <= 82) return { text: 'Heavy Showers', icon: '⛈️' };
  if (code >= 85 && code <= 86) return { text: 'Snow Showers', icon: '🌨️' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorm', icon: '⚡' };
  return { text: 'Fair Weather', icon: '🌤️' };
}

const CACHE_KEY = 'farmpro_cached_weather';

export function getCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, isOfflineCached: true };
  } catch (e) {
    return null;
  }
}

export function saveCachedWeather(data: WeatherData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save weather cache', e);
  }
}

// Fetch real-time weather from Open-Meteo
export async function fetchCurrentWeather(lat: number, lon: number, locationLabel = 'My Farm'): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true&hourly=relativehumidity_2m`;
  
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Weather fetch failed: ${response.statusText}`);
  }
  
  const json = await response.json();
  const current = json.current_weather;
  const { text, icon } = interpretWeatherCode(current?.weathercode ?? 0);
  
  // Approximate current hour humidity if available
  let humidity: number | undefined = undefined;
  if (json.hourly && Array.isArray(json.hourly.relativehumidity_2m)) {
    const currentHourIndex = new Date().getHours();
    humidity = json.hourly.relativehumidity_2m[currentHourIndex];
  }

  const weatherData: WeatherData = {
    temperature: Math.round(current.temperature),
    weatherCode: current.weathercode,
    windSpeed: Math.round(current.windspeed),
    humidity,
    conditionText: text,
    conditionIcon: icon,
    locationName: locationLabel,
    latitude: lat,
    longitude: lon,
    lastUpdated: Date.now(),
    isOfflineCached: false,
  };

  saveCachedWeather(weatherData);
  return weatherData;
}
