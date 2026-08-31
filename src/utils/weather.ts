// Utility for fetching real-time weather & agro-weather forecasts using Geolocation & Open-Meteo API
// Free, open-access, no API keys required, works globally with Zimbabwe/Southern Africa regional support.

export interface DailyForecast {
  date: string;
  dayName: string; // e.g. "Today", "Tomorrow", "Wed", "Thu"
  weatherCode: number;
  conditionText: string;
  conditionIcon: string;
  tempMax: number;
  tempMin: number;
  precipProbability: number;
  precipSum: number;
}

export interface AgroWeatherTip {
  category: 'spraying' | 'irrigation' | 'fieldwork' | 'livestock' | 'harvest';
  title: string;
  advice: string;
  status: 'good' | 'caution' | 'warning';
  icon: string;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity?: number;
  conditionText: string;
  conditionIcon: string;
  locationName: string;
  region?: string;
  latitude: number;
  longitude: number;
  lastUpdated: number;
  isOfflineCached?: boolean;
  forecast?: DailyForecast[];
  agroTips?: AgroWeatherTip[];
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

// Generate smart, actionable agro-weather tips based on temperature, wind, humidity, and precipitation
export function generateAgroTips(
  currentTemp: number,
  windSpeed: number,
  humidity: number = 50,
  forecast: DailyForecast[] = [],
  regionName?: string
): AgroWeatherTip[] {
  const tips: AgroWeatherTip[] = [];
  const next2DaysPrecip = forecast.slice(0, 2).reduce((max, f) => Math.max(max, f.precipProbability), 0);
  const maxTempNext = forecast.length > 0 ? Math.max(...forecast.slice(0, 3).map((f) => f.tempMax)) : currentTemp;

  // 1. Spraying & Pest Control Tip
  if (windSpeed > 15) {
    tips.push({
      category: 'spraying',
      title: 'High Wind - Postpone Spraying',
      advice: `Wind speed is ${windSpeed} km/h. Avoid pesticide, fungicide, or herbicide spraying today to prevent chemical drift and uneven coverage.`,
      status: 'warning',
      icon: '💨',
    });
  } else if (next2DaysPrecip > 50) {
    tips.push({
      category: 'spraying',
      title: 'Rain Warning - Avoid Foliar Sprays',
      advice: `Rain probability is ${next2DaysPrecip}%. Postpone foliar fertilizers and contact sprays to prevent chemical wash-off.`,
      status: 'caution',
      icon: '🌧️',
    });
  } else if (windSpeed <= 12 && next2DaysPrecip <= 25) {
    tips.push({
      category: 'spraying',
      title: 'Optimal Spraying Conditions',
      advice: `Gentle winds (${windSpeed} km/h) and low rain risk (${next2DaysPrecip}%). Excellent window for fall armyworm, aphid, and fungicide treatments.`,
      status: 'good',
      icon: '🌱',
    });
  }

  // 2. Irrigation & Soil Moisture Tip
  if (maxTempNext >= 29 && next2DaysPrecip < 30) {
    tips.push({
      category: 'irrigation',
      title: 'High Evaporation - Morning Irrigation',
      advice: `Temperatures reaching ${maxTempNext}°C with high sun. Water crops early morning (before 8 AM) or late afternoon. Apply organic mulch to lock in soil moisture.`,
      status: 'caution',
      icon: '💧',
    });
  } else if (next2DaysPrecip >= 60) {
    tips.push({
      category: 'irrigation',
      title: 'Rain Inbound - Pause Irrigation',
      advice: `Rain forecast in your area (${next2DaysPrecip}% chance). Turn off automated drip or overhead sprinklers and inspect contour ridges and field drainage.`,
      status: 'good',
      icon: '🌧️',
    });
  } else {
    tips.push({
      category: 'irrigation',
      title: 'Standard Moisture Maintenance',
      advice: `Moderate temperatures (${currentTemp}°C) and balanced humidity (${humidity}%). Maintain normal watering schedules for vegetative crops.`,
      status: 'good',
      icon: '💦',
    });
  }

  // 3. Livestock Health & Welfare Tip
  if (currentTemp >= 30 || maxTempNext >= 32) {
    tips.push({
      category: 'livestock',
      title: 'Livestock Heat Alert',
      advice: `High ambient heat. Ensure clean, cool water for poultry and cattle at all times. Open coop side-flaps for air circulation to prevent heat stroke in broilers.`,
      status: 'warning',
      icon: '🐔',
    });
  } else if (humidity > 75 || next2DaysPrecip > 60) {
    tips.push({
      category: 'livestock',
      title: 'Dampness Alert - Check Poultry Bedding',
      advice: `High humidity (${humidity}%). Keep chicken coop wood shavings dry to prevent coccidiosis. Check cattle for tick attachment along the ear and belly line.`,
      status: 'caution',
      icon: '🛡️',
    });
  } else {
    tips.push({
      category: 'livestock',
      title: 'Favorable Livestock Weather',
      advice: `Comfortable outdoor conditions. Excellent for free-range grazing, cattle dipping routines, and high poultry feed conversion.`,
      status: 'good',
      icon: '🐄',
    });
  }

  // 4. Harvesting & Fieldwork Tip
  if (next2DaysPrecip <= 15 && currentTemp >= 22) {
    tips.push({
      category: 'harvest',
      title: 'Dry Window - Great for Harvest & Drying',
      advice: `Clear, sunny skies forecast. Favorable window for harvesting maize, curing groundnuts on racks, cutting grass forage, and drying field produce.`,
      status: 'good',
      icon: '🌾',
    });
  } else if (next2DaysPrecip > 50) {
    tips.push({
      category: 'harvest',
      title: 'Cover Harvested Crops & Seedbeds',
      advice: `Rain expected. Protect bagged grain, nursery seedlings, and drying groundnuts under waterproof tarpaulins or inside dry storage sheds.`,
      status: 'caution',
      icon: '⛺',
    });
  }

  return tips;
}

const CACHE_KEY = 'farmpro_cached_weather';

export function getDefaultForecast(): DailyForecast[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  return [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : days[d.getDay()];
    const isoDate = d.toISOString().split('T')[0];

    // Realistic varied summer/harvest weather defaults
    const tempMax = 26 + (offset % 3);
    const tempMin = 14 + (offset % 2);
    const precipProb = offset === 1 ? 25 : offset === 3 ? 40 : 10;

    return {
      date: isoDate,
      dayName,
      weatherCode: precipProb > 30 ? 61 : offset % 2 === 0 ? 1 : 2,
      conditionText: precipProb > 30 ? 'Rain Showers' : offset % 2 === 0 ? 'Mainly Clear' : 'Partly Cloudy',
      conditionIcon: precipProb > 30 ? '🌧️' : offset % 2 === 0 ? '🌤️' : '⛅',
      tempMax,
      tempMin,
      precipProbability: precipProb,
      precipSum: precipProb > 30 ? 4.2 : 0,
    };
  });
}

export function getCachedWeather(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.forecast || parsed.forecast.length === 0) {
      parsed.forecast = getDefaultForecast();
    }
    if (!parsed.agroTips || parsed.agroTips.length === 0) {
      parsed.agroTips = generateAgroTips(parsed.temperature || 24, parsed.windSpeed || 8, parsed.humidity || 50, parsed.forecast);
    }
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

// Fetch real-time weather & 5-day daily forecast from Open-Meteo
export async function fetchCurrentWeather(lat: number, lon: number, locationLabel = 'My Farm'): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current_weather=true&hourly=relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
  
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Weather fetch failed: ${response.statusText}`);
  }
  
  const json = await response.json();
  const current = json.current_weather;
  const { text, icon } = interpretWeatherCode(current?.weathercode ?? 0);
  
  // Approximate current hour humidity if available
  let humidity: number = 50;
  if (json.hourly && Array.isArray(json.hourly.relativehumidity_2m)) {
    const currentHourIndex = new Date().getHours();
    humidity = json.hourly.relativehumidity_2m[currentHourIndex] ?? 50;
  }

  // Parse daily forecast
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast: DailyForecast[] = [];

  if (json.daily && Array.isArray(json.daily.time)) {
    const times: string[] = json.daily.time;
    const codes: number[] = json.daily.weathercode || [];
    const maxs: number[] = json.daily.temperature_2m_max || [];
    const mins: number[] = json.daily.temperature_2m_min || [];
    const precipProbs: number[] = json.daily.precipitation_probability_max || [];
    const precipSums: number[] = json.daily.precipitation_sum || [];

    for (let i = 0; i < Math.min(times.length, 5); i++) {
      const d = new Date(times[i]);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
      const wCode = codes[i] ?? 1;
      const cond = interpretWeatherCode(wCode);

      forecast.push({
        date: times[i],
        dayName,
        weatherCode: wCode,
        conditionText: cond.text,
        conditionIcon: cond.icon,
        tempMax: Math.round(maxs[i] ?? current.temperature),
        tempMin: Math.round(mins[i] ?? (current.temperature - 8)),
        precipProbability: Math.round(precipProbs[i] ?? 0),
        precipSum: Math.round((precipSums[i] ?? 0) * 10) / 10,
      });
    }
  }

  const finalForecast = forecast.length > 0 ? forecast : getDefaultForecast();
  const agroTips = generateAgroTips(Math.round(current.temperature), Math.round(current.windspeed), humidity, finalForecast, locationLabel);

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
    forecast: finalForecast,
    agroTips,
  };

  saveCachedWeather(weatherData);
  return weatherData;
}
