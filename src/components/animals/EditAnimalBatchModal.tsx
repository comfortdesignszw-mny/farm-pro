import React, { useState, useEffect } from 'react';
import { X, PawPrint, CheckCircle2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Animal, AnimalSpecies, AcquisitionMethod, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface EditAnimalBatchModalProps {
  isOpen: boolean;
  farm: Farm;
  animal: Animal | null;
  onClose: () => void;
  onSaved: (animal: Animal) => void;
  onDeleted?: (animalId: string) => void;
}

export const EditAnimalBatchModal: React.FC<EditAnimalBatchModalProps> = ({
  isOpen,
  farm,
  animal,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const [species, setSpecies] = useState<AnimalSpecies>('Cattle - Beef');
  const [breed, setBreed] = useState('');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [acquisitionMethod, setAcquisitionMethod] = useState<AcquisitionMethod>('bought');
  const [cost, setCost] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'sold' | 'culled'>('active');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (animal) {
      setSpecies(animal.species);
      setBreed(animal.breed || '');
      setBatchSize(animal.batchSize || 1);
      setAcquisitionDate(animal.acquisitionDate);
      setAcquisitionMethod(animal.acquisitionMethod);
      setCost(animal.cost || 0);
      setStatus(animal.status || 'active');
      setPhoto(animal.photo || null);
      setNotes(animal.notes || '');
    }
  }, [animal]);

  if (!isOpen || !animal) return null;

  const speciesOptions: AnimalSpecies[] = [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedAnimal: Animal = {
      ...animal,
      species,
      breed: breed.trim() || 'Mixed / Indigenous',
      batchSize: Number(batchSize) || 1,
      acquisitionDate,
      acquisitionMethod,
      cost: Number(cost) || 0,
      status,
      photo: photo || undefined,
      notes: notes.trim(),
    };

    await db.animals.put(updatedAnimal);
    onSaved(updatedAnimal);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this batch of ${animal.species}?`)) {
      await db.animals.delete(animal.id);
      await db.animalHealthRecords.where('animalId').equals(animal.id).delete();
      await db.animalFeedRecords.where('animalId').equals(animal.id).delete();
      await db.animalProductionRecords.where('animalId').equals(animal.id).delete();
      if (onDeleted) onDeleted(animal.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <PawPrint className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-farm-navy">
                Edit Livestock Batch
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Updating {animal.species}
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
          {/* Species */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
              Species Category
            </label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value as AnimalSpecies)}
              className="w-full min-h-[46px] px-3.5 py-2 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-slate-50 text-farm-navy"
            >
              {speciesOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Breed & Batch Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Breed / Variety
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="e.g. Mashona / Boer / Cobb500"
                className="w-full min-h-[46px] px-3.5 py-2 text-base font-medium rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Batch Size (Head)
              </label>
              <input
                type="number"
                min="1"
                required
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full min-h-[46px] px-3.5 py-2 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Status & Acquisition Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Batch Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full min-h-[46px] px-3 py-2 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                <option value="active">Active (On Farm)</option>
                <option value="sold">Sold</option>
                <option value="culled">Culled / Departed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Acquisition Method
              </label>
              <select
                value={acquisitionMethod}
                onChange={(e) => setAcquisitionMethod(e.target.value as AcquisitionMethod)}
                className="w-full min-h-[46px] px-3 py-2 text-base font-semibold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                <option value="bought">{t('animals.bought')}</option>
                <option value="born_on_farm">{t('animals.born_on_farm')}</option>
                <option value="gift">{t('animals.gift')}</option>
              </select>
            </div>
          </div>

          {/* Acquisition Date & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Acquisition Date
              </label>
              <input
                type="date"
                required
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2 text-sm sm:text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
                Cost ($ USD)
              </label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full min-h-[46px] px-3.5 py-2 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm sm:text-base font-bold text-farm-navy mb-1">
              Livestock Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Update Livestock Photo" />
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
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tag numbers, pen location, health notes..."
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Actions */}
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
