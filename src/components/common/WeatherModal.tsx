import React from 'react';
import { X, CloudSun, Wind, Droplets, MapPin, RefreshCw, Compass, Clock, CheckCircle2 } from 'lucide-react';
import { WeatherData } from '../../utils/weather';

interface WeatherModalProps {
  isOpen: boolean;
  weather: WeatherData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  weather,
  isLoading,
  onRefresh,
  onClose,
}) => {
  if (!isOpen) return null;

  const formattedTime = weather?.lastUpdated
    ? new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
              <CloudSun className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-farm-navy">Farm Weather Station</h3>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-farm-cyan" />
                <span>{weather?.locationName || 'Local Geolocation'}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {weather ? (
          <div className="space-y-4">
            {/* Main Temperature Hero */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-farm-navy to-slate-800 text-white shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-farm-cyan">
                  Current Condition
                </span>
                <div className="text-4xl sm:text-5xl font-black tracking-tight mt-1 flex items-baseline gap-1">
                  <span>{weather.temperature}°C</span>
                </div>
                <div className="text-base font-bold text-slate-200 mt-1 flex items-center gap-2">
                  <span>{weather.conditionIcon}</span>
                  <span>{weather.conditionText}</span>
                </div>
              </div>
              <div className="text-5xl sm:text-6xl drop-shadow-md select-none">
                {weather.conditionIcon}
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Wind Speed</div>
                  <div className="text-lg font-black text-farm-navy">{weather.windSpeed} km/h</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Humidity</div>
                  <div className="text-lg font-black text-farm-navy">
                    {weather.humidity !== undefined ? `${weather.humidity}%` : 'Optimal'}
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinates & Status */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <Compass className="w-3.5 h-3.5" />
                  Coordinates:
                </span>
                <span className="font-mono font-bold text-farm-navy">
                  {weather.latitude.toFixed(2)}°, {weather.longitude.toFixed(2)}°
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Last Updated:
                </span>
                <span className="font-bold text-farm-navy">{formattedTime}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span>Auto-refresh:</span>
                <span className="text-emerald-700 font-extrabold">Every 10 min active</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-70 transition-all"
              >
                <RefreshCw className={`w-4 h-4 text-farm-cyan ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Updating Weather...' : 'Refresh Now'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <CloudSun className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
            <p className="text-base font-bold text-slate-600">Connecting to weather satellites...</p>
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-farm-navy text-white font-bold text-sm cursor-pointer"
            >
              Retry Geolocation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
