import React, { useState } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import { WeatherData, AgroWeatherTip } from '../../utils/weather';
import { useTranslation } from 'react-i18next';

interface WeatherForecastCardProps {
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  farmLocation?: string;
}

export const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({
  weather,
  isLoading,
  onRefresh,
  farmLocation,
}) => {
  const { t } = useTranslation();
  const [showAllTips, setShowAllTips] = useState(false);
  const [showForecastDetails, setShowForecastDetails] = useState(false);

  if (!weather) return null;

  const forecast = weather.forecast || [];
  const agroTips: AgroWeatherTip[] = weather.agroTips || [];
  const locationDisplay = farmLocation || weather.locationName || 'Local Farm';
  const topTip = agroTips[0];

  return (
    <section
      id="dashboard-weather-forecast-card"
      className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200 transition-all"
    >
      {/* Compact Main Row: Current Weather & Key Metres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Weather Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-800 flex items-center justify-center shrink-0 text-2xl select-none shadow-2xs">
            {weather.conditionIcon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-farm-navy leading-none">
                {weather.temperature}°C
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-700">
                {weather.conditionText}
              </span>
              {weather.isOfflineCached && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Cached
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
              <span className="truncate">{locationDisplay}</span>
              <span>•</span>
              <span className="text-slate-400">
                {new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Middle/Right: Quick Agro Indicators + Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Spraying badge */}
          <div
            className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              weather.windSpeed <= 12
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
            title={`Wind: ${weather.windSpeed} km/h`}
          >
            <Wind className="w-3.5 h-3.5 shrink-0" />
            <span>{weather.windSpeed <= 12 ? 'Spraying: OK' : 'Wind: Caution'}</span>
            <span className="text-[10px] opacity-75 font-normal">({weather.windSpeed}km/h)</span>
          </div>

          {/* Rain / Humidity badge */}
          <div
            className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5"
            title={`Humidity: ${weather.humidity ?? 50}%, Rain Risk: ${forecast[0]?.precipProbability ?? 0}%`}
          >
            <Droplets className="w-3.5 h-3.5 shrink-0 text-blue-600" />
            <span>{forecast[0]?.precipProbability ? `${forecast[0].precipProbability}% Rain` : 'Dry'}</span>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            id="refresh-weather-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="min-h-[32px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-farm-navy text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 disabled:opacity-60 active:scale-95"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-3 h-3 text-slate-600 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
            <span className="hidden md:inline">{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* 5-Day Forecast Mini Pills Strip */}
      {forecast.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 uppercase tracking-wider">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>5-Day Outlook</span>
            </div>
            <button
              type="button"
              onClick={() => setShowForecastDetails(!showForecastDetails)}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{showForecastDetails ? 'Compact' : 'Details'}</span>
              {showForecastDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {forecast.map((day, idx) => (
              <div
                key={day.date || idx}
                className={`py-1.5 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  idx === 0
                    ? 'bg-sky-50/80 border-sky-300'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <span className="text-[11px] font-extrabold text-farm-navy">
                  {idx === 0 ? 'Today' : day.dayName}
                </span>
                <span className="text-base sm:text-lg select-none leading-tight my-0.5" role="img" aria-label={day.conditionText}>
                  {day.conditionIcon}
                </span>
                <span className="text-[11px] font-black text-slate-800">
                  {day.tempMax}°<span className="text-slate-400 font-medium text-[10px]">/{day.tempMin}°</span>
                </span>
                {showForecastDetails && (
                  <span className={`text-[9px] font-bold mt-0.5 px-1 rounded ${
                    day.precipProbability > 30 ? 'text-blue-700 bg-blue-100' : 'text-slate-500'
                  }`}>
                    {day.precipProbability}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Agro Advisory Snippet */}
      {topTip && (
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-base shrink-0 mt-0.5" role="img" aria-label="advisory icon">
                {topTip.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-farm-navy">
                    {topTip.title}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                      topTip.status === 'good'
                        ? 'bg-emerald-100 text-emerald-800'
                        : topTip.status === 'warning'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {topTip.status === 'good' ? 'Optimal' : topTip.status === 'warning' ? 'Alert' : 'Advisory'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-normal mt-0.5">
                  {showAllTips ? topTip.advice : `${topTip.advice.slice(0, 110)}${topTip.advice.length > 110 ? '...' : ''}`}
                </p>
              </div>
            </div>

            {agroTips.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllTips(!showAllTips)}
                className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-0.5 shrink-0 pt-0.5 cursor-pointer"
              >
                <span>{showAllTips ? 'Less' : `More (${agroTips.length})`}</span>
                {showAllTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Expanded extra tips */}
          {showAllTips && agroTips.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {agroTips.slice(1).map((tip, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-start gap-2 shadow-2xs"
                >
                  <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-farm-navy truncate">{tip.title}</span>
                      <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded shrink-0 ${
                        tip.status === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tip.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{tip.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
