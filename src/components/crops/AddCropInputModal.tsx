import React, { useState } from 'react';
import { X, Sprout, ArrowRight, ArrowLeft, CheckCircle2, DollarSign, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { CropCycle, InputRecord, InputType, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddCropInputModalProps {
  isOpen: boolean;
  farm: Farm;
  activeCycles: CropCycle[];
  selectedCycleId?: string;
  onClose: () => void;
  onSaved: (record: InputRecord) => void;
}

export const AddCropInputModal: React.FC<AddCropInputModalProps> = ({
  isOpen,
  farm,
  activeCycles,
  selectedCycleId,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [cycleId, setCycleId] = useState<string>(selectedCycleId || activeCycles[0]?.id || '');
  const [inputType, setInputType] = useState<InputType>('fertilizer');
  const [subtype, setSubtype] = useState('Compound D');
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState<number>(35);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentCycle = activeCycles.find((c) => c.id === cycleId) || activeCycles[0];
  const fieldSize = currentCycle?.fieldSize || farm.size || 1;
  const quantityPerHectare = fieldSize > 0 ? Number((quantity / fieldSize).toFixed(2)) : quantity;

  const handleTypeSelect = (type: InputType) => {
    setInputType(type);
    if (type === 'fertilizer') {
      setSubtype('Compound D');
      setUnit('kg');
    } else if (type === 'seed') {
      setSubtype('Seed Hybrid');
      setUnit('kg');
    } else if (type === 'spray') {
      setSubtype('Insecticide Spray');
      setUnit('L');
    } else if (type === 'labor') {
      setSubtype('Weeding / Planting Labor');
      setUnit('days');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cycleId && activeCycles.length > 0) {
      setCycleId(activeCycles[0].id);
    }

    const record: InputRecord = {
      id: 'input_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      cropCycleId: cycleId || activeCycles[0]?.id || 'default_cycle',
      type: inputType,
      subtype: subtype.trim() || inputType,
      quantity: Number(quantity) || 0,
      unit,
      quantityPerHectare,
      cost: Number(cost) || 0,
      date,
      photo: photo || undefined,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    await db.inputRecords.put(record);
    onSaved(record);
  };

  const getSubtypeSuggestions = () => {
    switch (inputType) {
      case 'fertilizer':
        return ['Compound D', 'Ammonium Nitrate (AN)', 'Urea', 'Single Superphosphate (SSP)', 'Compost / Manure', 'CAN'];
      case 'seed':
        return ['Certified Seed Pack', 'Local Hybrid Seed', 'Seedlings / Tubers'];
      case 'spray':
        return ['Insecticide (Karate/Belt)', 'Fungicide (Copper/Mancozeb)', 'Herbicide (Roundup/Atrazine)', 'Neem Organic Spray'];
      case 'labor':
        return ['Land Prep / Ploughing', 'Planting Labor', 'Weeding / Cultivation', 'Harvesting Labor'];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-farm-cyan/20 text-farm-navy text-sm font-extrabold">
              {t('common.step_x_of_y', { current: step, total: 2 })}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-farm-navy">
              {t('crops.add_input_btn')}
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

        {/* STEP 1: CROP & INPUT TYPE & SUBTYPE */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Select active crop if multiple */}
            {activeCycles.length > 1 && (
              <div>
                <label className="block text-base font-bold text-farm-navy mb-1.5">
                  Target Crop
                </label>
                <select
                  value={cycleId}
                  onChange={(e) => setCycleId(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-slate-50"
                >
                  {activeCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cropType} {c.variety ? `(${c.variety})` : ''} - {c.fieldId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4 Big Category Buttons */}
            <div>
              <label className="block text-base font-bold text-farm-navy mb-2">
                1. {t('crops.input_type')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'fertilizer', label: t('common.fertilizer'), emoji: '🌱' },
                  { id: 'seed', label: t('common.seeds'), emoji: '🌾' },
                  { id: 'spray', label: t('common.spray'), emoji: '🧪' },
                  { id: 'labor', label: t('common.labor'), emoji: '👥' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeSelect(item.id as InputType)}
                    className={`min-h-[56px] p-3 rounded-xl border-2 flex items-center gap-3 font-bold text-base transition-all cursor-pointer ${
                      inputType === item.id
                        ? 'border-farm-navy bg-farm-navy text-farm-cyan shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtype quick chips */}
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                2. Specific Product / Task Name
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {getSubtypeSuggestions().map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubtype(s)}
                    className={`min-h-[38px] px-3 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      subtype === s
                        ? 'bg-farm-cyan text-farm-navy'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                placeholder="e.g. Compound D or Weed Killer"
                className="w-full min-h-[48px] px-4 py-2.5 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
              />
            </div>

            <button
              type="button"
              id="input-next-step-btn"
              onClick={() => setStep(2)}
              className="w-full min-h-[54px] py-3.5 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer mt-4"
            >
              <span>{t('common.next')} (Quantity & Cost)</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* STEP 2: QUANTITY, AUTO-CALCULATED PER-HA, COST, DATE & PHOTO */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
            {/* Quantity + Unit */}
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Quantity Used (Whole Number)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={quantity || ''}
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') e.preventDefault();
                  }}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setQuantity(cleaned === '' ? ('' as any) : parseInt(cleaned, 10));
                  }}
                  placeholder="e.g. 50"
                  className="flex-1 min-h-[48px] px-4 py-2.5 text-xl font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-32 min-h-[48px] px-3 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-100 text-farm-navy outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="bags_50kg">50kg Bags</option>
                  <option value="L">Litres (L)</option>
                  <option value="ml">ml</option>
                  <option value="days">Person-Days</option>
                  <option value="packets">Packets</option>
                </select>
              </div>
            </div>

            {/* Auto Per-Hectare / Per-Acre Display Callout */}
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-farm-cyan/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-farm-cyan stroke-[2.5]" />
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">
                    {t('crops.auto_calculated')}
                  </div>
                  <div className="text-base font-extrabold text-farm-navy">
                    {quantityPerHectare} {unit} / {farm.sizeUnit}
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Field: {fieldSize} {farm.sizeUnit}
              </span>
            </div>

            {/* Cost & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-base font-bold text-farm-navy mb-1.5">
                  {t('common.cost')} ($ or Local) (Whole Number)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={cost || ''}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') e.preventDefault();
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setCost(cleaned === '' ? 0 : parseInt(cleaned, 10));
                    }}
                    placeholder="e.g. 35"
                    className="w-full min-h-[48px] pl-10 pr-3 py-2.5 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
                  />
                  <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-base font-bold text-farm-navy mb-1.5">
                  {t('common.date')}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[48px] px-3 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
                />
              </div>
            </div>

            {/* Photo */}
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Bag / Receipt / Field Photo {t('common.optional')}
              </label>
              <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Add Photo of Product" />
            </div>

            {/* Notes with Mic */}
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
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Applied in furrow, good rain followed"
                className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[54px] px-4 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('common.back')}</span>
              </button>
              <button
                type="submit"
                id="save-crop-input-btn"
                className="flex-1 min-h-[54px] py-3.5 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
                <span>{t('common.save')} Record</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
