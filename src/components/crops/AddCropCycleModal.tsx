import React, { useState } from 'react';
import { X, Wheat, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { CropCycle, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddCropCycleModalProps {
  isOpen: boolean;
  farm: Farm;
  defaultCropType?: string | null;
  onClose: () => void;
  onSaved: (cycle: CropCycle) => void;
}

export const AddCropCycleModal: React.FC<AddCropCycleModalProps> = ({
  isOpen,
  farm,
  defaultCropType,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCropType || 'Maize');
  const [cropType, setCropType] = useState(defaultCropType || 'Maize');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [fieldName, setFieldName] = useState('Field 1');
  const [fieldSize, setFieldSize] = useState<string>(farm.size ? String(farm.size) : '1');
  const [expectedYieldQuantity, setExpectedYieldQuantity] = useState<string>('');
  const [expectedYieldUnit, setExpectedYieldUnit] = useState<string>('bags_50kg');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<string>('');
  const [sellingPriceUnit, setSellingPriceUnit] = useState<string>('bags_50kg');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [harvestDateExpected, setHarvestDateExpected] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 120); // default 4 months for maize
    return d.toISOString().split('T')[0];
  });
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (defaultCropType) {
      if (defaultCropType === 'Other') {
        setSelectedCategory('Other');
        setIsOtherSelected(true);
        setCropType('');
      } else {
        setSelectedCategory(defaultCropType);
        setCropType(defaultCropType);
        setIsOtherSelected(false);
      }
    }
  }, [defaultCropType]);

  if (!isOpen) return null;

  const cropCategories: { name: string; icon: string }[] = [
    { name: 'Maize', icon: '🌽' },
    { name: 'Groundnuts', icon: '🥜' },
    { name: 'Tomatoes', icon: '🍅' },
    { name: 'Soybeans', icon: '🌿' },
    { name: 'Cabbage', icon: '🥬' },
    { name: 'Sorghum', icon: '🌾' },
    { name: 'Potatoes', icon: '🥔' },
    { name: 'Wheat', icon: '🌾' },
    { name: 'Fine Beans', icon: '🫘' },
    { name: 'Vegetables', icon: '🥗' },
    { name: 'Fruits', icon: '🍎' },
    { name: 'Other', icon: '✏️' },
  ];

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'Other') {
      setIsOtherSelected(true);
      setCropType(customCropName || '');
    } else {
      setIsOtherSelected(false);
      setCropType(cat);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCropName = isOtherSelected
      ? customCropName.trim() || 'Custom Crop'
      : cropType.trim() || 'Maize';

    const newCycle: CropCycle = {
      id: 'cycle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      farmId: farm.id,
      fieldId: fieldName,
      cropType: finalCropName,
      variety: variety.trim(),
      plantingDate,
      harvestDateExpected,
      status: 'active',
      photo: photo || undefined,
      fieldSize: Number(fieldSize) || 1,
      expectedYieldQuantity: expectedYieldQuantity !== '' ? Number(expectedYieldQuantity) : undefined,
      expectedYieldUnit: expectedYieldUnit || undefined,
      sellingPricePerUnit: sellingPricePerUnit !== '' ? Number(sellingPricePerUnit) : undefined,
      sellingPriceUnit: sellingPriceUnit || undefined,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    await db.cropCycles.put(newCycle);
    onSaved(newCycle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center">
              <Wheat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('crops.new_cycle_title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Crop Selector */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              {t('crops.crop_name')}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2.5">
              {cropCategories.map((c) => {
                const isSelected = selectedCategory === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectCategory(c.name)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-farm-navy text-farm-cyan border-farm-navy shadow-sm scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* If Other is selected or farmer wants custom crop */}
            {isOtherSelected ? (
              <div className="p-3 bg-cyan-50/80 rounded-xl border border-farm-cyan/40 space-y-1.5 animate-in fade-in duration-200">
                <label className="block text-xs font-black text-farm-navy uppercase tracking-wider">
                  Specify Custom Crop Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customCropName}
                  onChange={(e) => {
                    setCustomCropName(e.target.value);
                    setCropType(e.target.value);
                  }}
                  placeholder="e.g. Garlic, Sunflower, Sweet Potatoes, Paprika..."
                  className="w-full min-h-[48px] px-4 py-2.5 text-base font-semibold rounded-xl border-2 border-farm-cyan bg-white outline-none"
                />
              </div>
            ) : (
              <input
                type="text"
                required
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder="Crop name"
                className="w-full min-h-[44px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-200 focus:border-farm-cyan outline-none font-medium bg-slate-50"
              />
            )}
          </div>

          {/* Variety & Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('crops.variety_name')}
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. SC719 / Rodia"
                className="w-full min-h-[48px] px-4 py-2.5 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Field Size ({farm.sizeUnit})
              </label>
              <input
                type="text"
                required
                value={fieldSize}
                onChange={(e) => setFieldSize(e.target.value)}
                placeholder="e.g. 2, 5, 10"
                className="w-full min-h-[48px] px-4 py-2.5 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
              />
            </div>
          </div>

          {/* Planting Date & Expected Harvest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('crops.planting_date')}
              </label>
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('crops.expected_harvest')}
              </label>
              <input
                type="date"
                required
                value={harvestDateExpected}
                onChange={(e) => setHarvestDateExpected(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Selling Price & Expected Yield Estimation */}
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                💰 Market Price & Revenue Target (Optional)
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Estimator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selling Price ($ per unit)
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">$</span>
                    <input
                      type="text"
                      value={sellingPricePerUnit}
                      onChange={(e) => setSellingPricePerUnit(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full min-h-[42px] pl-7 pr-2.5 py-1.5 text-sm font-black rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-white font-mono"
                    />
                  </div>
                  <select
                    value={sellingPriceUnit}
                    onChange={(e) => setSellingPriceUnit(e.target.value)}
                    className="w-28 text-xs font-bold rounded-xl border-2 border-slate-300 bg-white px-2 py-1.5 outline-none"
                  >
                    <option value="bags_50kg">/ 50kg bag</option>
                    <option value="tonnes">/ Tonne</option>
                    <option value="kg">/ kg</option>
                    <option value="crates">/ Crate</option>
                    <option value="buckets_20L">/ 20L Bucket</option>
                  </select>
                </div>
              </div>

              {/* Target Yield */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Total Harvest
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={expectedYieldQuantity}
                    onChange={(e) => setExpectedYieldQuantity(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full min-h-[42px] px-3 py-1.5 text-sm font-black rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-white font-mono"
                  />
                  <select
                    value={expectedYieldUnit}
                    onChange={(e) => setExpectedYieldUnit(e.target.value)}
                    className="w-28 text-xs font-bold rounded-xl border-2 border-slate-300 bg-white px-2 py-1.5 outline-none"
                  >
                    <option value="bags_50kg">50kg bags</option>
                    <option value="tonnes">Tonnes</option>
                    <option value="kg">kg</option>
                    <option value="crates">Crates</option>
                    <option value="buckets_20L">Buckets</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Estimated revenue summary */}
            {parseFloat(sellingPricePerUnit) > 0 &&
              parseFloat(expectedYieldQuantity) > 0 && (
                <div className="p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Est. Potential Revenue:
                  </span>
                  <span className="text-base font-black text-emerald-800">
                    ${(parseFloat(sellingPricePerUnit) * parseFloat(expectedYieldQuantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
          </div>

          {/* Field Photo */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Crop / Field Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Take Crop Photo" />
          </div>

          {/* Notes with Voice input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-base font-bold text-farm-navy">
                {t('common.notes')} {t('common.optional')}
              </label>
              <VoiceInputButton
                onTranscript={(text) => setNotes((prev) => (prev ? `${prev} ${text}` : text))}
                label="Voice Note"
              />
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Planted with basal compound D, good moisture"
              className="w-full px-4 py-2.5 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-new-crop-cycle-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
              <span>{t('common.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
