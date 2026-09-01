import React, { useState, useRef } from 'react';
import { Sprout, Check, ArrowRight, MapPin, Globe, Sparkles, Upload, Loader2, Wheat, PawPrint, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../../i18n';
import { db, importDatabaseBackup } from '../../db';
import { Farm, LanguageCode, SizeUnit } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface OnboardingFlowProps {
  onComplete: (farm: Farm) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<LanguageCode>((i18n.language as LanguageCode) || 'en');
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreFileRef = useRef<HTMLInputElement | null>(null);

  // Farm Form State (max 4 fields)
  const [farmName, setFarmName] = useState('My Farm');
  const [farmSize, setFarmSize] = useState<string>('2.5');
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('ha');
  const [location, setLocation] = useState('Zimbabwe');
  const [cropsSpecialized, setCropsSpecialized] = useState<string[]>(['Maize', 'Beans']);

  // Article 4 Category Tabs & Custom Other Inputs
  const [activeCategoryTab, setActiveCategoryTab] = useState<'crops' | 'animals'>('crops');
  const [showCustomCropInput, setShowCustomCropInput] = useState(false);
  const [customCropText, setCustomCropText] = useState('');
  const [showCustomAnimalInput, setShowCustomAnimalInput] = useState(false);
  const [customAnimalText, setCustomAnimalText] = useState('');

  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedFarm, setSavedFarm] = useState<Farm | null>(null);

  const handleSelectLanguage = (lang: LanguageCode) => {
    setSelectedLang(lang);
    changeAppLanguage(lang);
  };

  const handleLanguageStepNext = () => {
    setStep(2);
  };

  const handleToggleItem = (item: string) => {
    if (cropsSpecialized.includes(item)) {
      if (cropsSpecialized.length > 1) {
        setCropsSpecialized(cropsSpecialized.filter((c) => c !== item));
      }
    } else {
      setCropsSpecialized([...cropsSpecialized, item]);
    }
  };

  const handleAddCustomCrop = () => {
    const trimmed = customCropText.trim();
    if (trimmed && !cropsSpecialized.includes(trimmed)) {
      setCropsSpecialized([...cropsSpecialized, trimmed]);
      setCustomCropText('');
      setShowCustomCropInput(false);
    }
  };

  const handleAddCustomAnimal = () => {
    const trimmed = customAnimalText.trim();
    if (trimmed && !cropsSpecialized.includes(trimmed)) {
      setCropsSpecialized([...cropsSpecialized, trimmed]);
      setCustomAnimalText('');
      setShowCustomAnimalInput(false);
    }
  };

  const handleRemoveItem = (item: string) => {
    if (cropsSpecialized.length > 1) {
      setCropsSpecialized(cropsSpecialized.filter((c) => c !== item));
    }
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        alert('Empty backup file.');
        return;
      }

      setIsRestoring(true);
      try {
        const result = await importDatabaseBackup(content);
        if (result.success && result.farm) {
          onComplete(result.farm);
        } else {
          alert(result.message || 'Failed to restore backup.');
        }
      } catch (err: any) {
        alert(`Restore error: ${err?.message || 'Unknown error'}`);
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedSize = parseFloat(farmSize) || 1;

    const newFarm: Farm = {
      id: 'farm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: farmName.trim() || 'My Family Farm',
      size: parsedSize,
      sizeUnit,
      location: location.trim() || 'Local District',
      cropsSpecialized,
      createdAt: Date.now(),
    };

    // Save farm to Dexie
    await db.farms.put(newFarm);

    // Create a default field for immediate convenience with primary crop or first item
    const primaryCrop = cropsSpecialized.find(
      (c) =>
        !animalOptionsList.includes(c) &&
        !['Chickens', 'Broilers', 'Ducks', 'Pigs', 'Horses', 'Cattle', 'Goats', 'Sheep'].some((a) =>
          c.includes(a)
        )
    ) || cropsSpecialized[0] || 'Maize';

    await db.fields.put({
      id: 'field_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      farmId: newFarm.id,
      name: 'Main Field',
      size: newFarm.size,
      cropCurrent: primaryCrop,
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

  // Quick options for Crops including Beans, Horticulture, and common regional crops
  const cropOptionsList = [
    'Maize',
    'Beans',
    'Horticulture',
    'Groundnuts',
    'Tomatoes',
    'Soybeans',
    'Cabbage',
    'Sorghum',
    'Potatoes',
    'Wheat',
  ];

  // Quick options for Animals matching all animal options in animal section
  const animalOptionsList = [
    'Chickens - Layers',
    'Broilers',
    'Ducks',
    'Pigs',
    'Horses',
    'Cattle - Beef',
    'Cattle - Dairy',
    'Goats',
    'Sheep',
  ];

  const selectedCropsCount = cropsSpecialized.filter(
    (c) => cropOptionsList.includes(c) || !animalOptionsList.includes(c)
  ).length;

  const selectedAnimalsCount = cropsSpecialized.filter((c) =>
    animalOptionsList.includes(c)
  ).length;

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
                  type="text"
                  required
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="e.g. 5"
                  className="flex-1 min-h-[48px] px-4 py-3 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan focus:ring-2 focus:ring-farm-cyan/20 outline-none font-mono font-bold"
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

            {/* Field 4: Crops or Animals you grow */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-base font-bold text-farm-navy">
                  4. {t('onboarding.crops_specialized')}
                </label>
                <span className="text-xs font-semibold text-slate-500">
                  {cropsSpecialized.length} selected
                </span>
              </div>

              {/* Category Segmented Tabs (Crops / Animals) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('crops')}
                  className={`py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeCategoryTab === 'crops'
                      ? 'bg-white text-farm-navy shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wheat className="w-4 h-4 text-emerald-600" />
                  <span>Crops & Produce</span>
                  {selectedCropsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                      {selectedCropsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('animals')}
                  className={`py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeCategoryTab === 'animals'
                      ? 'bg-white text-farm-navy shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PawPrint className="w-4 h-4 text-amber-600" />
                  <span>Animals / Livestock</span>
                  {selectedAnimalsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-xs rounded-full">
                      {selectedAnimalsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* CROPS TAB CONTENT */}
              {activeCategoryTab === 'crops' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap gap-1.5">
                    {cropOptionsList.map((crop) => {
                      const isSelected = cropsSpecialized.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => handleToggleItem(crop)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-farm-navy text-farm-cyan border-2 border-farm-navy shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-transparent'
                          }`}
                        >
                          {isSelected ? `✓ ${crop}` : `+ ${crop}`}
                        </button>
                      );
                    })}

                    {/* Other / Custom Crop Option Button */}
                    <button
                      type="button"
                      onClick={() => setShowCustomCropInput(!showCustomCropInput)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer select-none border-2 ${
                        showCustomCropInput
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        Other (Custom Crop)
                      </span>
                    </button>
                  </div>

                  {/* Custom Crop Input Box */}
                  {showCustomCropInput && (
                    <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-300 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                        Specify Custom Crop Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={customCropText}
                          onChange={(e) => setCustomCropText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCrop();
                            }
                          }}
                          placeholder="e.g. Garlic, Sunflowers, Sweet Potatoes, Paprika..."
                          className="flex-1 min-h-[42px] px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-emerald-400 bg-white outline-none focus:border-farm-navy"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCrop}
                          disabled={!customCropText.trim()}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ANIMALS TAB CONTENT */}
              {activeCategoryTab === 'animals' && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap gap-1.5">
                    {animalOptionsList.map((animal) => {
                      const isSelected = cropsSpecialized.includes(animal);
                      return (
                        <button
                          key={animal}
                          type="button"
                          onClick={() => handleToggleItem(animal)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
                            isSelected
                              ? 'bg-farm-navy text-farm-cyan border-2 border-farm-navy shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-transparent'
                          }`}
                        >
                          {isSelected ? `✓ ${animal}` : `+ ${animal}`}
                        </button>
                      );
                    })}

                    {/* Other / Custom Animal Option Button */}
                    <button
                      type="button"
                      onClick={() => setShowCustomAnimalInput(!showCustomAnimalInput)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer select-none border-2 ${
                        showCustomAnimalInput
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        Other (Custom Animal)
                      </span>
                    </button>
                  </div>

                  {/* Custom Animal Input Box */}
                  {showCustomAnimalInput && (
                    <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-300 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider">
                        Specify Custom Animal / Livestock
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={customAnimalText}
                          onChange={(e) => setCustomAnimalText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomAnimal();
                            }
                          }}
                          placeholder="e.g. Rabbits, Quails, Tilapia/Fish, Bees, Turkeys..."
                          className="flex-1 min-h-[42px] px-3 py-1.5 text-sm font-semibold rounded-lg border-2 border-amber-400 bg-white outline-none focus:border-farm-navy"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomAnimal}
                          disabled={!customAnimalText.trim()}
                          className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Currently Selected Items Badges */}
              {cropsSpecialized.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-500 mb-1.5">
                    Selected for your farm:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cropsSpecialized.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-farm-navy text-farm-cyan border border-farm-navy/20 shadow-xs"
                      >
                        <span>{item}</span>
                        {cropsSpecialized.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            className="hover:text-red-300 p-0.5 rounded cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3 h-3 stroke-[3]" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

          <div className="pt-2 text-center">
            <input
              type="file"
              ref={restoreFileRef}
              accept=".json,application/json"
              onChange={handleRestoreBackupFile}
              className="hidden"
              id="onboarding-restore-input"
            />
            <button
              type="button"
              disabled={isRestoring}
              onClick={() => restoreFileRef.current?.click()}
              className="text-sm font-bold text-farm-navy hover:text-cyan-700 underline inline-flex items-center gap-1.5 cursor-pointer py-1"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  <span>Restoring Farm Backup...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-cyan-600" />
                  <span>Have a previous backup? Restore from JSON file</span>
                </>
              )}
            </button>
          </div>
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

