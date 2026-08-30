import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, DollarSign, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Animal, AnimalHealthRecord, HealthRecordType } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddAnimalHealthModalProps {
  isOpen: boolean;
  animals: Animal[];
  selectedAnimalId?: string;
  onClose: () => void;
  onSaved: (record: AnimalHealthRecord) => void;
}

export const AddAnimalHealthModal: React.FC<AddAnimalHealthModalProps> = ({
  isOpen,
  animals,
  selectedAnimalId,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [animalId, setAnimalId] = useState<string>(selectedAnimalId || animals[0]?.id || '');
  const [healthType, setHealthType] = useState<HealthRecordType>('vaccination');
  const [product, setProduct] = useState('Newcastle Vaccine');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90); // default 3 months booster
    return d.toISOString().split('T')[0];
  });
  const [cost, setCost] = useState<number>(10);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleTypeSelect = (type: HealthRecordType) => {
    setHealthType(type);
    if (type === 'vaccination') setProduct('Newcastle / Anthrax / Blackleg');
    else if (type === 'deworming') setProduct('Albendazole / Ivermectin');
    else if (type === 'treatment') setProduct('Oxytetracycline (Terramycin)');
    else setProduct('Routine Health Inspection');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const record: AnimalHealthRecord = {
      id: 'health_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      animalId: animalId || animals[0]?.id || 'default_animal',
      type: healthType,
      product: product.trim() || healthType,
      date,
      nextDueDate: nextDueDate || undefined,
      cost: Number(cost) || 0,
      photo: photo || undefined,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    await db.animalHealthRecords.put(record);
    onSaved(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('animals.add_health_btn')}
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
          {/* Target Livestock */}
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

          {/* Health Category Grid */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-2">
              1. Treatment Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'vaccination', label: t('animals.vaccination'), icon: '💉' },
                { id: 'deworming', label: t('animals.deworming'), icon: '🪱' },
                { id: 'treatment', label: t('animals.treatment'), icon: '💊' },
                { id: 'checkup', label: t('animals.checkup'), icon: '🩺' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTypeSelect(item.id as HealthRecordType)}
                  className={`min-h-[50px] p-2.5 rounded-xl border-2 flex items-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                    healthType === item.id
                      ? 'border-farm-navy bg-farm-navy text-farm-cyan shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              2. {t('animals.product_used')}
            </label>
            <input
              type="text"
              required
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Terramycin spray / Albendazole drench"
              className="w-full min-h-[48px] px-4 py-2.5 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Date & Next Due Date (Feeds Home upcoming alerts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('common.date')} Given
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5 flex items-center gap-1.5 text-emerald-800">
                <BellRing className="w-4 h-4 text-emerald-600" />
                <span>Next Booster / Due Date</span>
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-bold rounded-xl border-2 border-emerald-500 bg-emerald-50/50 outline-none"
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Cost ($ or Local Currency)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full min-h-[48px] pl-10 pr-3 py-2.5 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
              <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Bottle / Vial / Symptoms Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Add Photo of Medicine/Vial" />
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
              placeholder="e.g. All 50 birds vaccinated in water fonts"
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-animal-health-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
              <span>{t('common.save')} Health Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
