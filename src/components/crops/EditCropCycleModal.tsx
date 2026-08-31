import React, { useState, useEffect } from 'react';
import { X, Wheat, CheckCircle2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { CropCycle, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface EditCropCycleModalProps {
  isOpen: boolean;
  farm: Farm;
  cycle: CropCycle | null;
  onClose: () => void;
  onSaved: (cycle: CropCycle) => void;
  onDeleted?: (cycleId: string) => void;
}

export const EditCropCycleModal: React.FC<EditCropCycleModalProps> = ({
  isOpen,
  farm,
  cycle,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const [cropType, setCropType] = useState('');
  const [variety, setVariety] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [fieldSize, setFieldSize] = useState<number>(1);
  const [expectedYieldQuantity, setExpectedYieldQuantity] = useState<number | ''>('');
  const [expectedYieldUnit, setExpectedYieldUnit] = useState<string>('bags_50kg');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number | ''>('');
  const [sellingPriceUnit, setSellingPriceUnit] = useState<string>('bags_50kg');
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestDateExpected, setHarvestDateExpected] = useState('');
  const [status, setStatus] = useState<'active' | 'harvested' | 'failed'>('active');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (cycle) {
      setCropType(cycle.cropType);
      setVariety(cycle.variety || '');
      setFieldName(cycle.fieldId || 'Field 1');
      setFieldSize(cycle.fieldSize || farm.size || 1);
      setExpectedYieldQuantity(cycle.expectedYieldQuantity ?? '');
      setExpectedYieldUnit(cycle.expectedYieldUnit || 'bags_50kg');
      setSellingPricePerUnit(cycle.sellingPricePerUnit ?? '');
      setSellingPriceUnit(cycle.sellingPriceUnit || 'bags_50kg');
      setPlantingDate(cycle.plantingDate);
      setHarvestDateExpected(cycle.harvestDateExpected || '');
      setStatus(cycle.status || 'active');
      setPhoto(cycle.photo || null);
      setNotes(cycle.notes || '');
    }
  }, [cycle, farm]);

  if (!isOpen || !cycle) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedCycle: CropCycle = {
      ...cycle,
      cropType: cropType.trim() || 'Maize',
      variety: variety.trim(),
      fieldId: fieldName.trim() || 'Field 1',
      fieldSize: Number(fieldSize) || 1,
      expectedYieldQuantity: expectedYieldQuantity !== '' ? Number(expectedYieldQuantity) : undefined,
      expectedYieldUnit: expectedYieldUnit || undefined,
      sellingPricePerUnit: sellingPricePerUnit !== '' ? Number(sellingPricePerUnit) : undefined,
      sellingPriceUnit: sellingPriceUnit || undefined,
      plantingDate,
      harvestDateExpected,
      status,
      photo: photo || undefined,
      notes: notes.trim(),
    };

    await db.cropCycles.put(updatedCycle);
    onSaved(updatedCycle);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${cycle.cropType}" and its associated logs?`)) {
      await db.cropCycles.delete(cycle.id);
      await db.inputRecords.where('cropCycleId').equals(cycle.id).delete();
      await db.yieldRecords.where('cropCycleId').equals(cycle.id).delete();
      if (onDeleted) onDeleted(cycle.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center">
              <Wheat className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-farm-navy">
                Edit Crop Record
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Updating {cycle.cropType}
              </span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Crop Selector */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
              Crop Name / Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-2">
              {cropCategories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCropType(c.name === 'Other' ? '' : c.name)}
                  className={`min-h-[38px] px-2 py-1 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                    cropType === c.name || (c.name === 'Other' && !cropCategories.some(cat => cat.name === cropType))
                      ? 'bg-farm-navy text-farm-cyan border-farm-navy shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              placeholder="Crop name (e.g. Maize, Tomatoes, Garlic...)"
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Variety & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Variety / Cultivar
              </label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. SC719 / Rodia"
                className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Growth Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full min-h-[46px] px-3 py-2 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                <option value="active">Active (Growing)</option>
                <option value="harvested">Harvested</option>
                <option value="failed">Failed / Terminated</option>
              </select>
            </div>
          </div>

          {/* Field & Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Field Identifier
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. Field 1 / North Paddock"
                className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Field Size ({farm.sizeUnit}) (Whole Number)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={fieldSize || ''}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') e.preventDefault();
                }}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setFieldSize(cleaned === '' ? ('' as any) : parseInt(cleaned, 10));
                }}
                placeholder="e.g. 2"
                className="w-full min-h-[46px] px-3.5 py-2 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
              />
            </div>
          </div>

          {/* Planting Date & Expected Harvest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Planting Date
              </label>
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 text-sm sm:text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Expected Harvest
              </label>
              <input
                type="date"
                value={harvestDateExpected}
                onChange={(e) => setHarvestDateExpected(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 text-sm sm:text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
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
                  Selling Price ($ per unit - Whole Number)
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">$</span>
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
                  Expected Total Harvest (Whole Number)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={expectedYieldQuantity}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') e.preventDefault();
                    }}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, '');
                      setExpectedYieldQuantity(cleaned === '' ? '' : parseInt(cleaned, 10));
                    }}
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
            {typeof sellingPricePerUnit === 'number' &&
              sellingPricePerUnit > 0 &&
              typeof expectedYieldQuantity === 'number' &&
              expectedYieldQuantity > 0 && (
                <div className="p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
                    Est. Potential Revenue:
                  </span>
                  <span className="text-base font-black text-emerald-800">
                    ${(sellingPricePerUnit * expectedYieldQuantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
              Field Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Update Crop Photo" />
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm sm:text-base font-bold text-farm-navy">
                Notes
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
              placeholder="Notes, inputs applied, soil notes..."
              className="w-full px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="min-h-[48px] px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] py-3 px-5 bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-farm-cyan" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
