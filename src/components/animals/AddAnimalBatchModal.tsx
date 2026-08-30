import React, { useState } from 'react';
import { X, PawPrint, CheckCircle2, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Animal, AnimalSpecies, AcquisitionMethod, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddAnimalBatchModalProps {
  isOpen: boolean;
  farm: Farm;
  defaultSpecies?: AnimalSpecies | null;
  onClose: () => void;
  onSaved: (animal: Animal) => void;
}

export const AddAnimalBatchModal: React.FC<AddAnimalBatchModalProps> = ({
  isOpen,
  farm,
  defaultSpecies,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [species, setSpecies] = useState<string>(defaultSpecies || 'Cattle - Beef');
  const [customSpecies, setCustomSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [batchSize, setBatchSize] = useState<number>(10);
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [acquisitionMethod, setAcquisitionMethod] = useState<AcquisitionMethod>('bought');
  const [cost, setCost] = useState<number>(0);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const speciesOptions = [
    'Chickens - Layers',
    'Broilers',
    'Ducks',
    'Pigs',
    'Horses',
    'Cattle - Beef',
    'Cattle - Dairy',
    'Goats',
    'Sheep',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSpecies = species === 'Other' ? (customSpecies.trim() || 'Other Livestock') : species;

    const newAnimal: Animal = {
      id: 'animal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      farmId: farm.id,
      species: finalSpecies as AnimalSpecies,
      breed: breed.trim() || 'Mixed / Indigenous',
      batchSize: Math.max(1, Math.round(Number(batchSize) || 1)),
      acquisitionDate,
      acquisitionMethod,
      cost: Math.max(0, Math.round(Number(cost) || 0)),
      photo: photo || undefined,
      notes: notes.trim(),
      status: 'active',
      createdAt: Date.now(),
    };

    await db.animals.put(newAnimal);
    onSaved(newAnimal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center">
              <PawPrint className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('animals.add_batch_title')}
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
          {/* Species */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              1. Species Category
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-slate-50 text-farm-navy"
            >
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'Other' ? 'Other (Specify Custom Livestock / Poultry / Fish)' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Species Input (Shown when Other is selected) */}
          {species === 'Other' && (
            <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-150 space-y-1.5">
              <label className="block text-sm font-bold text-emerald-950">
                Specify Custom Animal Type / Species *
              </label>
              <input
                type="text"
                required
                value={customSpecies}
                onChange={(e) => setCustomSpecies(e.target.value)}
                placeholder="e.g. Quails, Guinea Fowl, Rabbits, Turkeys, Tilapia/Fish, Bees, Pigeons"
                className="w-full min-h-[46px] px-3.5 py-2 text-base font-bold rounded-xl border-2 border-emerald-400 bg-white focus:border-farm-navy outline-none text-slate-900"
              />
              <p className="text-xs text-emerald-800 font-medium">
                Enter the specific animal or livestock you are rearing.
              </p>
            </div>
          )}

          {/* Breed & Batch Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                2. {t('animals.breed')}
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Mashona / Boer / Cobb500"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-medium rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                3. {t('animals.batch_size')} (Whole Number)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={batchSize || ''}
                onKeyDown={(e) => {
                  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') e.preventDefault();
                }}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setBatchSize(cleaned === '' ? ('' as any) : parseInt(cleaned, 10));
                }}
                placeholder="e.g. 10"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-xl font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
              />
            </div>
          </div>

          {/* Acquisition Date & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('animals.acquisition_date')}
              </label>
              <input
                type="date"
                required
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('animals.acquisition_method')}
              </label>
              <select
                value={acquisitionMethod}
                onChange={(e) => setAcquisitionMethod(e.target.value as AcquisitionMethod)}
                className="w-full min-h-[48px] px-3 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                <option value="bought">{t('animals.bought')}</option>
                <option value="born_on_farm">{t('animals.born_on_farm')}</option>
                <option value="gift">{t('animals.gift')}</option>
              </select>
            </div>
          </div>

          {/* Cost if bought */}
          {acquisitionMethod === 'bought' && (
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Total Purchase Cost ($) (Whole Number)
              </label>
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
                placeholder="e.g. 150"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
              />
            </div>
          )}

          {/* Photo */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Herd / Flock Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Add Photo of Livestock" />
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
              placeholder="e.g. Tag numbers, healthy condition, penned in north kraal"
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-animal-batch-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
              <span>{t('common.save')} {t('common.animals')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
