import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WeatherData,
  getCachedWeather,
  fetchCurrentWeather,
} from '../utils/weather';

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(() => {
    const cached = getCachedWeather();
    if (cached) return cached;
    // Default offline fallback without any HTTP call
    return {
      temperature: 24,
      weatherCode: 1,
      windSpeed: 8,
      humidity: 50,
      conditionText: 'Fair Weather',
      conditionIcon: '🌤️',
      locationName: 'Local Farm',
      latitude: -17.8252,
      longitude: 31.0335,
      lastUpdated: Date.now(),
      isOfflineCached: true,
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);

  const updateWeatherForCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentWeather(lat, lon, label || 'Farm Location');
      setWeather(data);
      setError(null);
    } catch (err: any) {
      console.warn('Weather fetch error:', err);
      // Fallback to cache
      const cached = getCachedWeather();
      if (cached) {
        setWeather(cached);
      }
      setError(err?.message || 'Failed to update live weather. Using cached data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Explicit user-triggered weather refresh only (does NOT auto-fire on mount)
  const refreshWeather = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.onLine) {
      const cached = getCachedWeather();
      if (cached) setWeather(cached);
      setError('Offline mode: Using local weather cache.');
      return;
    }

    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setGeoCoords({ lat, lon });
          updateWeatherForCoords(lat, lon, 'Local Weather');
        },
        (geoError) => {
          console.warn('Geolocation denied/unavailable:', geoError.message);
          const defaultLat = -17.8252;
          const defaultLon = 31.0335;
          setGeoCoords({ lat: defaultLat, lon: defaultLon });
          updateWeatherForCoords(defaultLat, defaultLon, 'Regional Weather');
        },
        { timeout: 8000, maximumAge: 600000 }
      );
    } else {
      const defaultLat = -17.8252;
      const defaultLon = 31.0335;
      updateWeatherForCoords(defaultLat, defaultLon, 'Regional Weather');
    }
  }, [updateWeatherForCoords]);

  return {
    weather,
    isLoading,
    error,
    geoCoords,
    refreshWeather,
  };
}
