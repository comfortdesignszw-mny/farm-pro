import React, { useState } from 'react';
import { X, Egg, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Animal, AnimalProductionRecord } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';

interface AddAnimalProductionModalProps {
  isOpen: boolean;
  animals: Animal[];
  selectedAnimalId?: string;
  onClose: () => void;
  onSaved: (record: AnimalProductionRecord) => void;
}

export const AddAnimalProductionModal: React.FC<AddAnimalProductionModalProps> = ({
  isOpen,
  animals,
  selectedAnimalId,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [animalId, setAnimalId] = useState<string>(selectedAnimalId || animals[0]?.id || '');
  const [productType, setProductType] = useState('Eggs (Mazai / Amaqanda)');
  const [quantity, setQuantity] = useState<number>(30);
  const [unit, setUnit] = useState('crates');
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [photo, setPhoto] = useState<Blob | null>(null);

  if (!isOpen) return null;

  const productOptions = [
    { label: 'Eggs (Mazai / Amaqanda)', unit: 'crates' },
    { label: 'Milk (Mukaka / Uchago)', unit: 'Litres' },
    { label: 'Meat / Dressed weight', unit: 'kg' },
    { label: 'Manure / Compost', unit: 'bags' },
    { label: 'Wool / Fleece', unit: 'kg' },
  ];

  const handleSelectProduct = (p: { label: string; unit: string }) => {
    setProductType(p.label);
    setUnit(p.unit);
  };

  const totalValue =
    typeof sellingPricePerUnit === 'number' && sellingPricePerUnit > 0
      ? Number((sellingPricePerUnit * quantity).toFixed(2))
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: AnimalProductionRecord = {
      id: 'prod_' + Date.now(),
      animalId: animalId || animals[0]?.id || 'default_animal',
      productType,
      quantity: Number(quantity) || 0,
      unit,
      sellingPricePerUnit: sellingPricePerUnit !== '' ? Number(sellingPricePerUnit) : undefined,
      totalEstimatedValue: totalValue,
      date,
      photo: photo || undefined,
      createdAt: Date.now(),
    };

    await db.animalProductionRecords.add(record);
    onSaved(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Egg className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('animals.add_production_btn')}
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
          {animals.length > 1 && (
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Target Animals
              </label>
              <select
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-slate-50 text-farm-navy"
              >
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.species} ({a.breed}) - {a.batchSize} heads
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Product Type Buttons */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              1. {t('animals.production_type')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {productOptions.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    productType === p.label
                      ? 'bg-farm-navy text-farm-cyan border-2 border-farm-navy'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Unit */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              2. Quantity Harvested / Collected
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.5"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="flex-1 min-h-[48px] px-4 py-2.5 text-2xl font-black rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-32 min-h-[48px] px-3 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-100 text-farm-navy outline-none"
              />
            </div>
          </div>

          {/* Selling Price per Unit (Optional) */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-farm-navy">
                Selling Price ($ per {unit}) {t('common.optional')}
              </label>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                Production Value
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-base">$</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={sellingPricePerUnit}
                onChange={(e) => setSellingPricePerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 5.50"
                className="w-full min-h-[44px] pl-8 pr-3 py-2 text-base font-black rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-white"
              />
            </div>
            {totalValue !== undefined && (
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 flex items-center justify-between text-xs font-bold">
                <span className="text-amber-900">Total Production Value:</span>
                <span className="text-sm font-black text-amber-800">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              3. {t('common.date')}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Production Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Add Photo of Product" />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="save-animal-production-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
              <span>{t('common.save')} Production Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
