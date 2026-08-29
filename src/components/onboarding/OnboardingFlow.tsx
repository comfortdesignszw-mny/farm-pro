import React, { useState } from 'react';
import { Sprout, Check, ArrowRight, MapPin, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../../i18n';
import { db } from '../../db';
import { Farm, LanguageCode, SizeUnit } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface OnboardingFlowProps {
  onComplete: (farm: Farm) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>((i18n.language as LanguageCode) || 'en');

  // Farm Form State (max 4 fields)
  const [farmName, setFarmName] = useState('My Farm');
  const [farmSize, setFarmSize] = useState<number>(2.5);
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('ha');
  const [location, setLocation] = useState('Zimbabwe');
  const [cropsSpecialized, setCropsSpecialized] = useState<string[]>(['Maize', 'Groundnuts']);

  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedFarm, setSavedFarm] = useState<Farm | null>(null);

  const handleSelectLanguage = (lang: LanguageCode) => {
    setSelectedLang(lang);
    changeAppLanguage(lang);
  };

  const handleLanguageStepNext = () => {
    setStep(2);
  };

  const handleToggleCrop = (crop: string) => {
    if (cropsSpecialized.includes(crop)) {
      if (cropsSpecialized.length > 1) {
        setCropsSpecialized(cropsSpecialized.filter((c) => c !== crop));
      }
    } else {
      setCropsSpecialized([...cropsSpecialized, crop]);
    }
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();

    const newFarm: Farm = {
      id: 'farm_' + Date.now(),
      name: farmName.trim() || 'My Family Farm',
      size: Number(farmSize) || 1,
      sizeUnit,
      location: location.trim() || 'Local District',
      cropsSpecialized,
      createdAt: Date.now(),
    };

    // Save farm to Dexie
    await db.farms.add(newFarm);

    // Create a default field for immediate convenience
    await db.fields.add({
      id: 'field_1',
      farmId: newFarm.id,
      name: 'Main Field',
      size: newFarm.size,
      cropCurrent: cropsSpecialized[0] || 'Maize',
    });

    localStorage.setItem('farmpro_onboarding_completed', 'true');
    setSavedFarm(newFarm);
    setIsSavedModalOpen(true);
  };

  const handleConfirmFinish = () => {
    if (savedFarm) {
      onComplete(savedFarm);
    }
  };

  const commonCropsList = ['Maize', 'Groundnuts', 'Tomatoes', 'Soybeans', 'Cabbage', 'Sorghum'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Brand Top */}
      <div className="text-center pt-4 pb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-navy text-farm-cyan shadow-md mb-3">
          <Sprout className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-farm-navy tracking-tight">
          Farm Pro
        </h1>
        <p className="text-base text-slate-600 font-medium mt-1">
          {t('common.tagline')}
        </p>
      </div>

      {/* STEP 1: LANGUAGE PICKER */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 my-auto animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-farm-cyan mb-2">
            <Globe className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wider uppercase">Step 1 of 2</span>
          </div>

          <h2 className="text-2xl font-bold text-farm-navy mb-1">
            {t('onboarding.select_language')}
          </h2>
          <p className="text-base text-slate-600 mb-6">
            {t('onboarding.select_language_sub')}
          </p>

          <div className="space-y-3 mb-8">
            <button
              type="button"
              id="lang-option-en"
              onClick={() => handleSelectLanguage('en')}
              className={`w-full min-h-[58px] p-4 rounded-xl border-2 flex items-center justify-between text-left transition-all cursor-pointer ${
                selectedLang === 'en'
                  ? 'border-farm-cyan bg-farm-cyan/10 font-bold text-farm-navy shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 font-medium text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <div className="text-lg font-bold">English</div>
                  <div className="text-sm text-slate-500">Record keeping & Advisory</div>
                </div>
              </div>
              {selectedLang === 'en' && <Check className="w-6 h-6 text-farm-cyan stroke-[3]" />}
            </button>

            <button
              type="button"
              id="lang-option-sn"
              onClick={() => handleSelectLanguage('sn')}
              className={`w-full min-h-[58px] p-4 rounded-xl border-2 flex items-center justify-between text-left transition-all cursor-pointer ${
                selectedLang === 'sn'
                  ? 'border-farm-cyan bg-farm-cyan/10 font-bold text-farm-navy shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 font-medium text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇿🇼</span>
                <div>
                  <div className="text-lg font-bold">ChiShona</div>
                  <div className="text-sm text-slate-500">Kunyora zvinyorwa nezivo zvepurazi</div>
                </div>
              </div>
              {selectedLang === 'sn' && <Check className="w-6 h-6 text-farm-cyan stroke-[3]" />}
            </button>

            <button
              type="button"
              id="lang-option-nd"
              onClick={() => handleSelectLanguage('nd')}
              className={`w-full min-h-[58px] p-4 rounded-xl border-2 flex items-center justify-between text-left transition-all cursor-pointer ${
                selectedLang === 'nd'
                  ? 'border-farm-cyan bg-farm-cyan/10 font-bold text-farm-navy shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 font-medium text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇿🇼</span>
                <div>
                  <div className="text-lg font-bold">IsiNdebele</div>
                  <div className="text-sm text-slate-500">Amarekhodi lolwazi lwasengadini</div>
                </div>
              </div>
              {selectedLang === 'nd' && <Check className="w-6 h-6 text-farm-cyan stroke-[3]" />}
            </button>
          </div>

          <button
            type="button"
            id="onboarding-next-btn"
            onClick={handleLanguageStepNext}
            className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
          >
            <span>{t('common.next')}</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* STEP 2: FARM PROFILE FORM (MAX 4 FIELDS) */}
      {step === 2 && (
        <form
          onSubmit={handleSaveFarm}
          className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 my-auto animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-farm-cyan tracking-wider uppercase">Step 2 of 2</span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              {t('common.back')}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-farm-navy mb-1">
            {t('onboarding.farm_setup_title')}
          </h2>
          <p className="text-base text-slate-600 mb-5">
            {t('onboarding.farm_setup_sub')}
          </p>

          <div className="space-y-4 mb-6">
            {/* Field 1: Farm Name */}
            <div>
              <label htmlFor="farm-name-input" className="block text-base font-bold text-farm-navy mb-1.5">
                1. {t('onboarding.farm_name')}
              </label>
              <input
                id="farm-name-input"
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder={t('onboarding.farm_name_placeholder')}
                className="w-full min-h-[48px] px-4 py-3 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan focus:ring-2 focus:ring-farm-cyan/20 outline-none bg-white font-medium"
              />
            </div>

            {/* Field 2: Farm Size + Unit */}
            <div>
              <label htmlFor="farm-size-input" className="block text-base font-bold text-farm-navy mb-1.5">
                2. {t('onboarding.farm_size')}
              </label>
              <div className="flex gap-2">
                <input
                  id="farm-size-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={farmSize}
                  onChange={(e) => setFarmSize(Number(e.target.value))}
                  className="flex-1 min-h-[48px] px-4 py-3 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan focus:ring-2 focus:ring-farm-cyan/20 outline-none font-medium"
                />
                <select
                  id="farm-size-unit-select"
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
                  className="w-32 min-h-[48px] px-3 py-3 text-lg font-bold rounded-xl border-2 border-slate-300 bg-slate-100 text-farm-navy focus:border-farm-cyan outline-none"
                >
                  <option value="ha">Hectares (ha)</option>
                  <option value="acre">Acres</option>
                </select>
              </div>
            </div>

            {/* Field 3: Location */}
            <div>
              <label htmlFor="farm-location-input" className="block text-base font-bold text-farm-navy mb-1.5">
                3. {t('onboarding.location')}
              </label>
              <div className="relative">
                <input
                  id="farm-location-input"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('onboarding.location_placeholder')}
                  className="w-full min-h-[48px] pl-11 pr-4 py-3 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan focus:ring-2 focus:ring-farm-cyan/20 outline-none font-medium"
                />
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Field 4: Main Crops Specialized */}
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                4. {t('onboarding.crops_specialized')}
              </label>
              <div className="flex flex-wrap gap-2">
                {commonCropsList.map((crop) => {
                  const isSelected = cropsSpecialized.includes(crop);
                  return (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => handleToggleCrop(crop)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-base font-bold transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-farm-navy text-farm-cyan border-2 border-farm-navy'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-transparent'
                      }`}
                    >
                      {isSelected ? `✓ ${crop}` : `+ ${crop}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="start-farm-btn"
            className="w-full min-h-[56px] py-4 px-6 bg-farm-cyan hover:bg-farm-cyan-light active:scale-[0.98] text-farm-navy font-extrabold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer"
          >
            <Sparkles className="w-6 h-6" />
            <span>{t('onboarding.start_farming')}</span>
          </button>
        </form>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSavedModalOpen}
        title={t('common.saved')}
        message={`Welcome to ${farmName}! Your farm records and advisory are ready offline.`}
        onClose={handleConfirmFinish}
        actionText={t('onboarding.start_farming')}
      />

      <div className="text-center text-xs text-slate-500 py-2">
        Farm Pro • Offline-first agricultural system
      </div>
    </div>
  );
};
