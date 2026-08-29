import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  PawPrint,
  BookOpen,
  ArrowRight,
  Edit2,
  Trash2,
  Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Animal, AnimalSpecies, Farm } from '../../types';
import { SpeciesGuideModal } from './SpeciesGuideModal';
import { AddAnimalBatchModal } from './AddAnimalBatchModal';
import { EditAnimalBatchModal } from './EditAnimalBatchModal';
import { AnimalDetailView } from './AnimalDetailView';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { BlobThumbnail } from '../common/BlobThumbnail';
import { shareAnimalDetails } from '../../utils/shareUtils';

interface AnimalsModuleProps {
  farm: Farm;
  selectedAnimalId?: string | null;
  onClearSelectedAnimal?: () => void;
}

export const AnimalsModule: React.FC<AnimalsModuleProps> = ({
  farm,
  selectedAnimalId,
  onClearSelectedAnimal,
}) => {
  const { t } = useTranslation();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [activeAnimal, setActiveAnimal] = useState<Animal | null>(null);

  // Species guide modal & add/edit modal states
  const [selectedGuideSpecies, setSelectedGuideSpecies] = useState<AnimalSpecies | null>(null);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [speciesToAdd, setSpeciesToAdd] = useState<AnimalSpecies | null>(null);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const loadAnimals = async () => {
    const list = await db.animals.toArray();
    setAnimals(list.sort((a, b) => b.createdAt - a.createdAt));

    if (selectedAnimalId) {
      const found = list.find((a) => a.id === selectedAnimalId);
      if (found) setActiveAnimal(found);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, [selectedAnimalId]);

  const speciesList: { id: AnimalSpecies; label: string; icon: string; emoji: string }[] = [
    { id: 'Chickens - Layers', label: 'Chickens (Layers)', icon: '🐔', emoji: '🥚' },
    { id: 'Broilers', label: 'Broilers (Meat)', icon: '🍗', emoji: '🍗' },
    { id: 'Ducks', label: 'Ducks (Amadada)', icon: '🦆', emoji: '🦆' },
    { id: 'Pigs', label: 'Pigs (Nguruve)', icon: '🐖', emoji: '🥓' },
    { id: 'Horses', label: 'Horses (Amabhiza)', icon: '🐎', emoji: '🚜' },
    { id: 'Cattle - Beef', label: 'Cattle (Beef)', icon: '🐂', emoji: '🥩' },
    { id: 'Cattle - Dairy', label: 'Cattle (Dairy)', icon: '🐄', emoji: '🥛' },
    { id: 'Goats', label: 'Goats (Mbudzi)', icon: '🐐', emoji: '🐐' },
    { id: 'Sheep', label: 'Sheep (Hwai/Izimvu)', icon: '🐑', emoji: '🐑' },
  ];

  const getSpeciesEmoji = (species: string): string => {
    if (species.includes('Chickens') || species.includes('Layers')) return '🐔';
    if (species.includes('Broilers')) return '🍗';
    if (species.includes('Ducks')) return '🦆';
    if (species.includes('Pigs')) return '🐖';
    if (species.includes('Horses')) return '🐎';
    if (species.includes('Dairy')) return '🐄';
    if (species.includes('Cattle') || species.includes('Beef')) return '🐂';
    if (species.includes('Goats')) return '🐐';
    if (species.includes('Sheep')) return '🐑';
    return '🐾';
  };

  const handleShare = async (e: React.MouseEvent, animal: Animal) => {
    e.stopPropagation();
    const res = await shareAnimalDetails(animal, farm);
    if (res.message) {
      setConfirmMsg(res.message);
    }
  };

  const handleEdit = (e: React.MouseEvent, animal: Animal) => {
    e.stopPropagation();
    setEditingAnimal(animal);
  };

  const handleDelete = async (e: React.MouseEvent, animal: Animal) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${animal.species}" batch and all its medical/feed logs?`)) {
      await db.animals.delete(animal.id);
      await db.animalHealthRecords.where('animalId').equals(animal.id).delete();
      await db.animalFeedRecords.where('animalId').equals(animal.id).delete();
      await db.animalProductionRecords.where('animalId').equals(animal.id).delete();
      loadAnimals();
      setConfirmMsg(`Livestock batch "${animal.species}" deleted.`);
    }
  };

  if (activeAnimal) {
    return (
      <div className="pb-24 max-w-4xl mx-auto px-3 sm:px-4 py-4">
        <AnimalDetailView
          animal={activeAnimal}
          farm={farm}
          onBack={() => {
            setActiveAnimal(null);
            if (onClearSelectedAnimal) onClearSelectedAnimal();
          }}
          onRefresh={loadAnimals}
        />
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-farm-navy">
            {t('animals.title')}
          </h2>
          <p className="text-sm font-semibold text-slate-600">
            {animals.reduce((acc, curr) => acc + curr.batchSize, 0)} total livestock registered
          </p>
        </div>

        <button
          type="button"
          id="new-animal-batch-btn"
          onClick={() => {
            setSpeciesToAdd('Cattle - Beef');
            setIsAddBatchOpen(true);
          }}
          className="min-h-[48px] px-4 py-2.5 rounded-xl bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-farm-cyan" />
          <span>{t('animals.add_batch_title')}</span>
        </button>
      </div>

      {/* 1. SPECIES ADVISORY GRID (Tap to view guide or add) */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-base sm:text-lg font-bold text-farm-navy flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-farm-cyan" />
            <span>{t('animals.species_grid_title')} (Tap for Guide)</span>
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {speciesList.map((item) => {
            const hasRegistered = animals.some((a) => a.species === item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGuideSpecies(item.id)}
                className={`min-h-[84px] sm:min-h-[96px] p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                  hasRegistered
                    ? 'bg-indigo-50/80 border-indigo-300 text-farm-navy'
                    : 'bg-white border-slate-200 hover:border-farm-cyan text-slate-800'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-xs sm:text-sm font-extrabold leading-tight line-clamp-2">
                  {item.label}
                </span>
                {hasRegistered && (
                  <span className="text-[10px] sm:text-[11px] font-black text-indigo-700 mt-0.5">
                    ✓ In Farm
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. MY REGISTERED LIVESTOCK BATCHES */}
      <section className="space-y-3">
        <h3 className="text-base sm:text-xl font-bold text-farm-navy flex items-center gap-2">
          <PawPrint className="w-5 h-5 text-indigo-600" />
          <span>My Farm Livestock Batches ({animals.length})</span>
        </h3>

        {animals.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-300 text-center space-y-3">
            <p className="text-base font-semibold text-slate-600">
              No livestock batches logged yet. Tap any animal above to view the guide and add your animals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {animals.map((a) => (
              <div
                key={a.id}
                onClick={() => setActiveAnimal(a)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-farm-cyan shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header with Thumbnail & Info */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <BlobThumbnail
                        blob={a.photo}
                        fallbackEmoji={getSpeciesEmoji(a.species)}
                        fallbackBgClass="bg-indigo-100 text-indigo-800"
                        alt={a.species}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0"
                      />

                      <div className="min-w-0">
                        <h4 className="text-lg sm:text-xl font-black text-farm-navy truncate">
                          {a.species}
                        </h4>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">
                          {a.batchSize} head • {a.breed}
                        </p>
                        <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                          Acquired: {a.acquisitionDate} ({a.acquisitionMethod})
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        a.status === 'active'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>

                {/* Management Action Bar: Edit, Delete, Share & View Details */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                  {/* Left: 3 Management Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={(e) => handleEdit(e, a)}
                      title="Edit Livestock Batch"
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-farm-navy font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-farm-navy" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, a)}
                      title="Delete Livestock Batch"
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    {/* Share Button (With Meta Tags) */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, a)}
                      title="Share Livestock Details & Meta Tags"
                      className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 text-cyan-900 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-farm-cyan" />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Right: View Logs Link */}
                  <div className="flex items-center gap-1 text-farm-cyan font-extrabold text-xs ml-auto">
                    <span>Logs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SPECIES GUIDE MODAL */}
      <SpeciesGuideModal
        species={selectedGuideSpecies}
        isOpen={!!selectedGuideSpecies}
        onClose={() => setSelectedGuideSpecies(null)}
        onAddAnimals={(sp) => {
          setSelectedGuideSpecies(null);
          setSpeciesToAdd(sp);
          setIsAddBatchOpen(true);
        }}
      />

      {/* ADD BATCH MODAL */}
      <AddAnimalBatchModal
        isOpen={isAddBatchOpen}
        farm={farm}
        defaultSpecies={speciesToAdd}
        onClose={() => setIsAddBatchOpen(false)}
        onSaved={(a) => {
          setIsAddBatchOpen(false);
          loadAnimals();
          setConfirmMsg(`${a.batchSize} head of ${a.species} added to your farm!`);
        }}
      />

      {/* EDIT BATCH MODAL */}
      <EditAnimalBatchModal
        isOpen={!!editingAnimal}
        farm={farm}
        animal={editingAnimal}
        onClose={() => setEditingAnimal(null)}
        onSaved={(a) => {
          setEditingAnimal(null);
          loadAnimals();
          setConfirmMsg(`${a.species} batch updated!`);
        }}
        onDeleted={() => {
          setEditingAnimal(null);
          loadAnimals();
          setConfirmMsg('Livestock batch deleted.');
        }}
      />

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!confirmMsg}
        title={t('common.saved')}
        message={confirmMsg || ''}
        onClose={() => setConfirmMsg(null)}
      />
    </div>
  );
};
