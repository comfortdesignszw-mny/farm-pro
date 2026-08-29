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
  const [fieldSize, setFieldSize] = useState<number>(farm.size || 1);
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
      id: 'cycle_' + Date.now(),
      farmId: farm.id,
      fieldId: fieldName,
      cropType: finalCropName,
      variety: variety.trim(),
      plantingDate,
      harvestDateExpected,
      status: 'active',
      photo: photo || undefined,
      fieldSize: Number(fieldSize) || 1,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    await db.cropCycles.add(newCycle);
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
                type="number"
                step="0.1"
                min="0.1"
                value={fieldSize}
                onChange={(e) => setFieldSize(Number(e.target.value))}
                className="w-full min-h-[48px] px-4 py-2.5 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
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
