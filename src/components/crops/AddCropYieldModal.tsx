import React, { useState } from 'react';
import { X, CheckCircle2, Calculator, ArrowRight, Wheat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { CropCycle, YieldRecord, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddCropYieldModalProps {
  isOpen: boolean;
  farm: Farm;
  activeCycles: CropCycle[];
  selectedCycleId?: string;
  onClose: () => void;
  onSaved: (record: YieldRecord) => void;
}

export const AddCropYieldModal: React.FC<AddCropYieldModalProps> = ({
  isOpen,
  farm,
  activeCycles,
  selectedCycleId,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [cycleId, setCycleId] = useState<string>(selectedCycleId || activeCycles[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(45);
  const [unit, setUnit] = useState('bags_50kg');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentCycle = activeCycles.find((c) => c.id === cycleId) || activeCycles[0];
  const fieldSize = currentCycle?.fieldSize || farm.size || 1;
  const quantityPerHectare = fieldSize > 0 ? Number((quantity / fieldSize).toFixed(2)) : quantity;
  const totalValue =
    typeof sellingPricePerUnit === 'number' && sellingPricePerUnit > 0
      ? Number((sellingPricePerUnit * quantity).toFixed(2))
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: YieldRecord = {
      id: 'yield_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      cropCycleId: cycleId || activeCycles[0]?.id || 'default_cycle',
      quantity: Number(quantity) || 0,
      unit,
      quantityPerHectare,
      sellingPricePerUnit: sellingPricePerUnit !== '' ? Number(sellingPricePerUnit) : undefined,
      totalEstimatedValue: totalValue,
      date,
      photo: photo || undefined,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    await db.yieldRecords.put(record);
    onSaved(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Wheat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('crops.add_yield_btn')}
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
          {/* Crop Selector */}
          {activeCycles.length > 1 && (
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Harvested Crop
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

          {/* Quantity + Unit */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              1. {t('crops.quantity')} Harvested (Whole Number)
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
                placeholder="e.g. 45"
                className="flex-1 min-h-[48px] px-4 py-2.5 text-2xl font-black rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-36 min-h-[48px] px-3 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-100 text-farm-navy outline-none"
              >
                <option value="bags_50kg">50kg Bags</option>
                <option value="tonnes">Tonnes</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="crates">Crates / Boxes</option>
                <option value="buckets_20L">20L Buckets</option>
              </select>
            </div>
          </div>

          {/* Auto Per Hectare / Per Acre Rate */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-6 h-6 text-emerald-600 stroke-[2.4]" />
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase">
                  {t('crops.auto_calculated')}
                </div>
                <div className="text-lg font-black text-emerald-950">
                  {quantityPerHectare} {unit} / {farm.sizeUnit}
                </div>
              </div>
            </div>
            <span className="text-xs text-emerald-700 font-bold">
              Field: {fieldSize} {farm.sizeUnit}
            </span>
          </div>

          {/* Selling Price per Unit (Optional) */}
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-farm-navy">
                Selling Price ($ per {unit === 'bags_50kg' ? '50kg bag' : unit === 'buckets_20L' ? 'bucket' : unit}) (Whole Number) {t('common.optional')}
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Market Value
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-base">$</span>
              <input
                type="number"
                step="1"
                min="0"
                value={sellingPricePerUnit}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') e.preventDefault();
                }}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setSellingPricePerUnit(cleaned === '' ? '' : parseInt(cleaned, 10));
                }}
                placeholder="e.g. 24"
                className="w-full min-h-[44px] pl-8 pr-3 py-2 text-base font-black rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-white font-mono"
              />
            </div>
            {totalValue !== undefined && (
              <div className="p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-900">Total Harvest Value:</span>
                <span className="text-sm font-black text-emerald-800">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              2. {t('common.date')} of Harvest
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
            />
          </div>

          {/* Harvest Photo */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              3. Harvest Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Add Photo of Harvest/Bags" />
          </div>

          {/* Notes */}
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
              placeholder="e.g. Good grain fill, 12% moisture measured"
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-crop-yield-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white font-extrabold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-200 stroke-[2.5]" />
              <span>{t('common.save')} {t('common.yield')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
