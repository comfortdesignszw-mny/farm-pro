import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WeatherData,
  getCachedWeather,
  fetchCurrentWeather,
} from '../utils/weather';

export function useWeather(refreshIntervalMs = 600000) { // 10 minutes default
  const [weather, setWeather] = useState<WeatherData | null>(() => getCachedWeather());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const intervalRef = useRef<number | null>(null);

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
      setError(err?.message || 'Failed to update weather');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWeather = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!navigator.onLine) {
      const cached = getCachedWeather();
      if (cached) setWeather(cached);
      setError('Offline mode: showing cached weather');
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
          console.warn('Geolocation error/denied:', geoError.message);
          // Default to Zimbabwe / Southern Africa standard coordinates (-17.8252, 31.0335 Harare) if location permission is not granted
          const defaultLat = -17.8252;
          const defaultLon = 31.0335;
          setGeoCoords({ lat: defaultLat, lon: defaultLon });
          updateWeatherForCoords(defaultLat, defaultLon, 'Regional Weather');
        },
        { timeout: 10000, maximumAge: 300000 }
      );
    } else {
      const defaultLat = -17.8252;
      const defaultLon = 31.0335;
      updateWeatherForCoords(defaultLat, defaultLon, 'Regional Weather');
    }
  }, [updateWeatherForCoords]);

  useEffect(() => {
    // Initial fetch
    refreshWeather();

    // Setup 10-minute interval on active connection
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (navigator.onLine) {
        refreshWeather();
      }
    }, refreshIntervalMs);

    // Online/Offline event listener
    const handleOnline = () => refreshWeather();
    window.addEventListener('online', handleOnline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshIntervalMs, refreshWeather]);

  return {
    weather,
    isLoading,
    error,
    geoCoords,
    refreshWeather,
  };
}
