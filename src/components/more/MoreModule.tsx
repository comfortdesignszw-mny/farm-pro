import React, { useState } from 'react';
import { Wrench, Settings, CloudSun, BookOpen, HardDrive, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Farm } from '../../types';
import { ToolsModule } from '../tools/ToolsModule';
import { SettingsModule } from '../settings/SettingsModule';

interface MoreModuleProps {
  farm: Farm;
  onFarmUpdated: (updated: Farm) => void;
  onResetComplete: () => void;
}

export const MoreModule: React.FC<MoreModuleProps> = ({
  farm,
  onFarmUpdated,
  onResetComplete,
}) => {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<'settings' | 'tools' | 'weather'>('settings');

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 py-4 space-y-5 animate-in fade-in duration-150">
      {/* Sub Navigation Strip (Icon + Word) */}
      <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs gap-1">
        <button
          type="button"
          id="subtab-settings-btn"
          onClick={() => setSubTab('settings')}
          className={`flex-1 min-h-[48px] py-2 px-3 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'settings'
              ? 'bg-farm-navy text-farm-cyan shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t('common.settings')}</span>
        </button>

        <button
          type="button"
          id="subtab-tools-btn"
          onClick={() => setSubTab('tools')}
          className={`flex-1 min-h-[48px] py-2 px-3 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'tools'
              ? 'bg-farm-navy text-farm-cyan shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t('common.tools')}</span>
        </button>

        <button
          type="button"
          id="subtab-weather-btn"
          onClick={() => setSubTab('weather')}
          className={`flex-1 min-h-[48px] py-2 px-3 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
            subTab === 'weather'
              ? 'bg-farm-navy text-farm-cyan shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CloudSun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <span>{t('common.weather')}</span>
        </button>
      </div>

      {/* Content */}
      {subTab === 'settings' && (
        <SettingsModule
          farm={farm}
          onFarmUpdated={onFarmUpdated}
          onResetComplete={onResetComplete}
        />
      )}

      {subTab === 'tools' && <ToolsModule farm={farm} />}

      {subTab === 'weather' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CloudSun className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-farm-navy">
                Seasonal Farm Calendar & Rain Advisory
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                {farm.location || 'Southern Africa Region'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="text-base font-bold text-amber-950 mb-1">
                🌧️ Effective Rain Planting Window
              </div>
              <p className="text-sm text-amber-900 leading-relaxed font-medium">
                Ensure topsoil receives at least 30–40mm of accumulated rainfall before dry-planting sensitive seeds. Check seedbed moisture depth (minimum 15cm moist soil).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200">
              <div className="text-base font-bold text-farm-navy mb-1">
                💧 Water Conservation & Mulching
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                Apply grass or crop residue mulch around horticultural crops (tomatoes, cabbage) to retain soil moisture by up to 50% and reduce soil temperature.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-base font-bold text-emerald-950 mb-1">
                🐂 Livestock Dry Season Supplementary
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                Ensure cattle and goats receive mineral licks (urea-molasses block or phosphate salts) during low-protein grass dry periods to maintain body condition.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
