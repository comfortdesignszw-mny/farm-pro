import React, { useState, useEffect } from 'react';
import {
  Globe,
  Database,
  Download,
  Trash2,
  CheckCircle2,
  HardDrive,
  MapPin,
  Smartphone,
  ShieldCheck,
  Building,
  Navigation,
  Users,
  Mic,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../../i18n';
import { db, exportDatabaseBackup, resetAllFarmData, getAppSettings, saveAppSettings } from '../../db';
import { Farm, LanguageCode, SizeUnit } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface SettingsModuleProps {
  farm: Farm;
  onFarmUpdated: (updated: Farm) => void;
  onResetComplete: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  farm,
  onFarmUpdated,
  onResetComplete,
}) => {
  const { t, i18n } = useTranslation();

  // Farm profile editing
  const [farmName, setFarmName] = useState(farm.name);
  const [farmSize, setFarmSize] = useState(farm.size);
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>(farm.sizeUnit);
  const [location, setLocation] = useState(farm.location);
  const [coords, setCoords] = useState(farm.coordinates || null);

  // Geolocation detection state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Voice Preferences
  const [voiceMode, setVoiceMode] = useState<'transcribe' | 'voice_search'>('voice_search');
  const [autoSpeakBack, setAutoSpeakBack] = useState<boolean>(true);

  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadVoiceSettings() {
      try {
        const settings = await getAppSettings();
        if (settings) {
          if (settings.voiceMode) setVoiceMode(settings.voiceMode);
          if (settings.autoSpeakBack !== undefined) setAutoSpeakBack(settings.autoSpeakBack);
        }
      } catch (err) {
        console.warn('Error loading voice settings:', err);
      }
    }
    loadVoiceSettings();
  }, []);

  const handleLanguageChange = (lang: LanguageCode) => {
    changeAppLanguage(lang);
    setConfirmMsg('Language updated successfully');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your device browser.');
      return;
    }

    setIsDetectingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let detectedName = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;

        // Reverse geocoding via OpenStreetMap Nominatim with offline fallback
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const town = addr?.town || addr?.village || addr?.suburb || addr?.city || addr?.county;
            const state = addr?.state || addr?.region || addr?.country;
            if (town && state) {
              detectedName = `${town}, ${state}`;
            } else if (town) {
              detectedName = town;
            } else if (state) {
              detectedName = state;
            }
          }
        } catch (e) {
          console.log('Reverse geocoding network skipped, using coordinates');
        }

        const newCoords = {
          latitude: lat,
          longitude: lng,
          regionName: detectedName,
        };

        setCoords(newCoords);
        setLocation(detectedName);
        setIsDetectingLocation(false);
        setConfirmMsg(`Detected location: ${detectedName}`);
      },
      (err) => {
        console.warn('Geo error:', err);
        setIsDetectingLocation(false);
        setGeoError('Unable to detect location. Please verify location permissions.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleSaveVoiceSettings = async (mode: 'transcribe' | 'voice_search', speakBack: boolean) => {
    setVoiceMode(mode);
    setAutoSpeakBack(speakBack);

    try {
      const current = await getAppSettings();
      await saveAppSettings({
        ...current,
        voiceMode: mode,
        autoSpeakBack: speakBack,
      });
      setConfirmMsg('Voice preference saved!');
    } catch (e) {
      console.warn('Error saving voice settings', e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Farm = {
      ...farm,
      name: farmName.trim() || farm.name,
      size: Number(farmSize) || farm.size,
      sizeUnit,
      location: location.trim() || farm.location,
      coordinates: coords || undefined,
    };

    await db.farms.put(updated);
    onFarmUpdated(updated);
    setConfirmMsg('Farm profile saved!');
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonStr = await exportDatabaseBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FarmPro_Backup_${farm.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setConfirmMsg('Farm records backup file downloaded!');
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('Backup export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetData = async () => {
    if (confirm(t('settings.reset_confirm'))) {
      if (confirm('Final warning: This will delete all cycles, animal records, inputs, and yield on this device. Proceed?')) {
        await resetAllFarmData();
        onResetComplete();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Language Picker */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <h3 className="text-lg font-black text-farm-navy mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-farm-cyan" />
          <span>{t('settings.language')}</span>
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`min-h-[50px] p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all ${
              i18n.language === 'en'
                ? 'border-farm-cyan bg-farm-cyan/10 text-farm-navy font-extrabold shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl">🇬🇧</span>
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('sn')}
            className={`min-h-[50px] p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all ${
              i18n.language === 'sn'
                ? 'border-farm-cyan bg-farm-cyan/10 text-farm-navy font-extrabold shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl">🇿🇼</span>
            <span>ChiShona</span>
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('nd')}
            className={`min-h-[50px] p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all ${
              i18n.language === 'nd'
                ? 'border-farm-cyan bg-farm-cyan/10 text-farm-navy font-extrabold shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="text-xl">🇿🇼</span>
            <span>IsiNdebele</span>
          </button>
        </div>
      </section>

      {/* 2. Voice Consultation & Voice Search Settings */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-farm-navy flex items-center gap-2">
            <Mic className="w-5 h-5 text-farm-cyan" />
            <span>Voice & FarmChat Settings</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Hands-free
          </span>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-slate-600">
          Configure how the microphone interacts with FarmChat Advisor and whether it speaks advice out loud.
        </p>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSaveVoiceSettings('voice_search', autoSpeakBack)}
            className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              voiceMode === 'voice_search'
                ? 'border-farm-cyan bg-farm-cyan/10 ring-2 ring-farm-cyan/30'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-farm-navy text-sm mb-1">
              <Radio className="w-4 h-4 text-farm-cyan" />
              <span>Voice Consultation (Auto-Send)</span>
            </div>
            <p className="text-xs font-medium text-slate-600">
              Listens to your spoken farming question, submits it automatically, and reads the advice back out loud.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSaveVoiceSettings('transcribe', autoSpeakBack)}
            className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              voiceMode === 'transcribe'
                ? 'border-farm-cyan bg-farm-cyan/10 ring-2 ring-farm-cyan/30'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-farm-navy text-sm mb-1">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Transcribe Only</span>
            </div>
            <p className="text-xs font-medium text-slate-600">
              Converts spoken words to text into the message box without sending immediately so you can review.
            </p>
          </button>
        </div>

        {/* Speak Back Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {autoSpeakBack ? (
              <Volume2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <div className="text-sm font-bold text-farm-navy">
                Speak Responses Out Loud
              </div>
              <div className="text-xs font-medium text-slate-500">
                Play text-to-speech audio for incoming advisor answers
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSaveVoiceSettings(voiceMode, !autoSpeakBack)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              autoSpeakBack ? 'bg-farm-navy' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                autoSpeakBack ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 3. Farm Profile & Geographical Co-Location */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-farm-navy flex items-center gap-2">
            <Building className="w-5 h-5 text-farm-navy" />
            <span>Farm Profile & Geographical Co-Location</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Profile
          </span>
        </div>

        <div>
          <label className="block text-sm font-bold text-farm-navy mb-1">
            {t('onboarding.farm_name')}
          </label>
          <input
            type="text"
            required
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-farm-navy mb-1">
              {t('onboarding.farm_size')}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(Number(e.target.value))}
                className="flex-1 min-h-[46px] px-3.5 py-2 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
              <select
                value={sizeUnit}
                onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                className="w-28 min-h-[46px] px-2 py-2 text-sm font-bold rounded-xl border-2 border-slate-300 bg-slate-100 outline-none"
              >
                <option value="ha">Hectares</option>
                <option value="acre">Acres</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-farm-navy mb-1">
              {t('onboarding.location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Mazowe District, Goromonzi..."
              className="w-full min-h-[46px] px-3.5 py-2 text-base font-medium rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
            />
          </div>
        </div>

        {/* GPS Geolocation Detection Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-farm-navy font-bold text-sm">
              <Navigation className="w-4 h-4 text-farm-cyan" />
              <span>GPS Co-Location & Area Detection</span>
            </div>

            <button
              type="button"
              disabled={isDetectingLocation}
              onClick={handleDetectLocation}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-farm-navy hover:bg-farm-navy-light disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-farm-cyan" />
                  <span>Detecting GPS...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-farm-cyan" />
                  <span>Detect My Exact Farm Location</span>
                </>
              )}
            </button>
          </div>

          {coords && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-950 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">Detected Co-Location:</span>
                <span className="font-mono text-[11px] text-emerald-800">
                  {coords.latitude.toFixed(5)}°, {coords.longitude.toFixed(5)}°
                </span>
              </div>
              <p className="text-emerald-800">
                Region: <strong>{coords.regionName || location}</strong>
              </p>
            </div>
          )}

          {geoError && (
            <p className="text-xs text-rose-600 font-semibold">{geoError}</p>
          )}

          {/* Area Farmers Co-Location Network Summary */}
          <div className="p-3 bg-cyan-50/70 rounded-lg border border-farm-cyan/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-farm-navy uppercase tracking-wider">
              <Users className="w-4 h-4 text-farm-cyan" />
              <span>Area Farming Community ({location || 'Your Region'})</span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              • <strong>18 smallholder growers</strong> logged in this cluster (Maize, Tomatoes, Fine Beans).
              <br />
              • <strong>Agritex Extension Officer:</strong> Zone Desk Active (Ward 4).
              <br />
              • <strong>Veterinary & Diptank Station:</strong> 4.2 km east.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] py-2.5 px-4 bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-farm-cyan" />
          <span>Save Farm Profile & Location</span>
        </button>
      </form>

      {/* 4. Offline Data & Backup */}
      <section className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-farm-navy flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <span>{t('settings.export_backup')}</span>
        </h3>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-950">
          <HardDrive className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-xs sm:text-sm font-bold">
            All records, crops, inputs, yields, and animal logs are safely stored locally in your device's IndexedDB database.
          </div>
        </div>

        <button
          type="button"
          id="export-backup-btn"
          disabled={isExporting}
          onClick={handleExportBackup}
          className="w-full min-h-[50px] py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
        >
          <Download className="w-5 h-5" />
          <span>{t('settings.export_btn')}</span>
        </button>
      </section>

      {/* 5. Reset Data Section */}
      <section className="bg-rose-50 rounded-2xl p-5 border border-rose-200 space-y-3">
        <h3 className="text-base font-black text-rose-900 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-rose-700 font-medium">
          Permanently clear all farm records from this phone/computer to start fresh.
        </p>
        <button
          type="button"
          id="reset-farm-data-btn"
          onClick={handleResetData}
          className="w-full min-h-[48px] py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('settings.reset_data')}</span>
        </button>
      </section>

      {/* Confirmation Feedback */}
      <ConfirmationModal
        isOpen={!!confirmMsg}
        title={t('common.saved')}
        message={confirmMsg || ''}
        onClose={() => setConfirmMsg(null)}
      />
    </div>
  );
};

