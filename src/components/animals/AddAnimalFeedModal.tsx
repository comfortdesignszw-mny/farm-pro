import React, { useState } from 'react';
import { X, Utensils, CheckCircle2, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Animal, AnimalFeedRecord } from '../../types';

interface AddAnimalFeedModalProps {
  isOpen: boolean;
  animals: Animal[];
  selectedAnimalId?: string;
  onClose: () => void;
  onSaved: (record: AnimalFeedRecord) => void;
}

export const AddAnimalFeedModal: React.FC<AddAnimalFeedModalProps> = ({
  isOpen,
  animals,
  selectedAnimalId,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [animalId, setAnimalId] = useState<string>(selectedAnimalId || animals[0]?.id || '');
  const [feedType, setFeedType] = useState('Layer Mash / Starter Crumb');
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState<number>(28);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const popularFeeds = [
    'Chick Starter Crumb',
    'Grower Mash',
    'Layer Mash',
    'Broiler Finisher',
    'Pig Grower / Creep',
    'Dairy Meal / Silage',
    'Hay / Rhodes Grass',
    'Salt / Mineral Lick',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: AnimalFeedRecord = {
      id: 'feed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      animalId: animalId || animals[0]?.id || 'default_animal',
      feedType: feedType.trim() || 'Feed',
      quantity: Number(quantity) || 0,
      unit,
      cost: Number(cost) || 0,
      date,
      createdAt: Date.now(),
    };

    await db.animalFeedRecords.put(record);
    onSaved(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Utensils className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('animals.add_feed_btn')}
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

          {/* Quick Feed Selector */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              {t('animals.feed_type')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {popularFeeds.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeedType(f)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    feedType === f
                      ? 'bg-farm-navy text-farm-cyan'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={feedType}
              onChange={(e) => setFeedType(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Quantity + Unit */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Quantity Feed (Whole Number)
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
                <option value="bales">Bales</option>
                <option value="buckets">Buckets</option>
              </select>
            </div>
          </div>

          {/* Cost & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Cost ($) (Whole Number)
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
                  placeholder="e.g. 28"
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
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="save-animal-feed-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
              <span>{t('common.save')} Feed Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
