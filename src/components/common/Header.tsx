import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Wifi,
  WifiOff,
  Globe,
  Clock,
  CloudSun,
  RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../../i18n';
import { Farm } from '../../types';
import { useWeather } from '../../hooks/useWeather';
import { WeatherModal } from './WeatherModal';

interface HeaderProps {
  farm?: Farm | null;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ farm, onOpenSettings }) => {
  const { t, i18n } = useTranslation();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // Local offline weather state with explicit manual refresh
  const { weather, isLoading: isWeatherLoading, refreshWeather } = useWeather();

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // every 10s for responsive minute change

    return () => clearInterval(timer);
  }, []);

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLangChange = (lang: string) => {
    changeAppLanguage(lang);
    setShowLangMenu(false);
  };

  // Format date & time
  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateShortString = currentTime.toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sticky top-0 z-40 bg-farm-navy text-white shadow-md border-b border-farm-navy-dark">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Left: Brand & Farm Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-farm-cyan/20 border border-farm-cyan flex items-center justify-center text-farm-cyan shrink-0">
            <Sprout className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white truncate leading-tight">
              {farm?.name || 'Farm Pro'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
              {farm ? `${farm.size} ${farm.sizeUnit} • ${farm.location || 'Local'}` : t('common.tagline')}
            </p>
          </div>
        </div>

        {/* Right Nav: Time Stamp, Weather Summary, Online Status & Lang Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Real-time Date & Time Stamp */}
          <div
            id="header-datetime-stamp"
            title={`${dateShortString} ${timeString}`}
            className="flex flex-col items-end justify-center px-2 sm:px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-right leading-none shrink-0"
          >
            <div className="flex items-center gap-1 text-farm-cyan font-mono font-black text-xs sm:text-sm">
              <Clock className="w-3 h-3 hidden xs:inline" />
              <span>{timeString}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-300 truncate max-w-[85px] sm:max-w-none mt-0.5">
              {dateShortString}
            </div>
          </div>

          {/* Real-life Geolocation Weather Pill (Tappable for full modal) */}
          <button
            type="button"
            id="header-weather-summary-btn"
            onClick={() => setIsWeatherModalOpen(true)}
            title="Current weather from geolocation. Tap for full report."
            className="min-h-[40px] px-2 sm:px-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 border border-slate-600/70 text-slate-100 flex items-center gap-1.5 font-bold text-xs sm:text-sm cursor-pointer transition-all shrink-0"
          >
            {weather ? (
              <>
                <span className="text-base sm:text-lg select-none leading-none">
                  {weather.conditionIcon}
                </span>
                <span className="font-extrabold text-white">
                  {weather.temperature}°C
                </span>
                <span className="hidden md:inline text-xs font-semibold text-slate-300">
                  {weather.conditionText}
                </span>
              </>
            ) : (
              <>
                <CloudSun className={`w-4 h-4 text-farm-cyan ${isWeatherLoading ? 'animate-spin' : ''}`} />
                <span className="text-xs text-slate-300">Weather</span>
              </>
            )}
          </button>

          {/* Online/Offline network pill (hidden on ultra-small screens to save space) */}
          <div
            id="network-status-badge"
            className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('common.online_badge')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('common.offline_badge')}</span>
              </>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="header-lang-btn"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 border border-slate-600/70 text-slate-100 flex items-center gap-1 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-farm-cyan" />
              <span>{i18n.language.toUpperCase()}</span>
            </button>

            {showLangMenu && (
              <div
                id="lang-dropdown-menu"
                className="absolute right-0 mt-2 w-44 bg-white text-farm-navy rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={() => handleLangChange('en')}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-100 ${
                    i18n.language === 'en' ? 'text-farm-cyan bg-slate-50 font-extrabold' : ''
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {i18n.language === 'en' && <span className="text-xs">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('sn')}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-100 ${
                    i18n.language === 'sn' ? 'text-farm-cyan bg-slate-50 font-extrabold' : ''
                  }`}
                >
                  <span>🇿🇼 Shona</span>
                  {i18n.language === 'sn' && <span className="text-xs">✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('nd')}
                  className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-slate-100 ${
                    i18n.language === 'nd' ? 'text-farm-cyan bg-slate-50 font-extrabold' : ''
                  }`}
                >
                  <span>🇿🇼 IsiNdebele</span>
                  {i18n.language === 'nd' && <span className="text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weather Detailed Modal */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        weather={weather}
        isLoading={isWeatherLoading}
        onRefresh={() => {
          refreshWeather();
        }}
        onClose={() => setIsWeatherModalOpen(false)}
      />
    </header>
  );
};
