import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  PawPrint,
  ShieldAlert,
  Utensils,
  Egg,
  PlusCircle,
  Trash2,
  BellRing,
  Share2,
  Edit2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import {
  Animal,
  AnimalHealthRecord,
  AnimalFeedRecord,
  AnimalProductionRecord,
  Farm,
} from '../../types';
import { AddAnimalHealthModal } from './AddAnimalHealthModal';
import { AddAnimalFeedModal } from './AddAnimalFeedModal';
import { AddAnimalProductionModal } from './AddAnimalProductionModal';
import { EditAnimalBatchModal } from './EditAnimalBatchModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { BlobThumbnail } from '../common/BlobThumbnail';
import { shareAnimalDetails } from '../../utils/shareUtils';

interface AnimalDetailViewProps {
  animal: Animal;
  farm: Farm;
  onBack: () => void;
  onRefresh: () => void;
}

export const AnimalDetailView: React.FC<AnimalDetailViewProps> = ({
  animal,
  farm,
  onBack,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'health' | 'feed' | 'production'>('health');
  const [healthRecords, setHealthRecords] = useState<AnimalHealthRecord[]>([]);
  const [feedRecords, setFeedRecords] = useState<AnimalFeedRecord[]>([]);
  const [productionRecords, setProductionRecords] = useState<AnimalProductionRecord[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modals
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const loadAnimalData = async () => {
    const [h, f, p] = await Promise.all([
      db.animalHealthRecords.where('animalId').equals(animal.id).toArray(),
      db.animalFeedRecords.where('animalId').equals(animal.id).toArray(),
      db.animalProductionRecords.where('animalId').equals(animal.id).toArray(),
    ]);

    setHealthRecords(h.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setFeedRecords(f.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setProductionRecords(p.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadAnimalData();
  }, [animal]);

  const handleShare = async () => {
    const res = await shareAnimalDetails(animal, farm);
    if (res.message) setConfirmMsg(res.message);
  };

  const handleDeleteAnimal = async () => {
    if (confirm('Are you sure you want to delete this livestock record and associated logs?')) {
      await db.animals.delete(animal.id);
      await db.animalHealthRecords.where('animalId').equals(animal.id).delete();
      await db.animalFeedRecords.where('animalId').equals(animal.id).delete();
      await db.animalProductionRecords.where('animalId').equals(animal.id).delete();
      onRefresh();
      onBack();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-farm-navy font-bold text-base flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Share with Meta Tags */}
          <button
            type="button"
            onClick={handleShare}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-farm-cyan" />
            <span>Share</span>
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-farm-navy font-bold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteAnimal}
            className="min-h-[44px] px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.delete')}</span>
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <BlobThumbnail
              blob={animal.photo}
              fallbackEmoji="🐾"
              fallbackBgClass="bg-indigo-100 text-indigo-800"
              alt={animal.species}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-farm-navy">
                  {animal.species}
                </h2>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-black">
                  {animal.breed}
                </span>
              </div>
              <p className="text-base font-bold text-slate-600 mt-0.5">
                {animal.batchSize} head total • Acquired: {animal.acquisitionDate} ({animal.acquisitionMethod})
              </p>
              {animal.notes && (
                <p className="text-sm text-slate-500 mt-1 italic">
                  "{animal.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-2 sm:w-auto">
            <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">Health Logs</div>
              <div className="text-xl font-black text-rose-700">{healthRecords.length}</div>
            </div>
            <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-500 uppercase">Feed Logs</div>
              <div className="text-xl font-black text-amber-700">{feedRecords.length}</div>
            </div>
          </div>
        </div>

        {/* 3 Quick Log Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsHealthModalOpen(true)}
            className="min-h-[48px] py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="truncate">{t('animals.add_health_btn')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFeedModalOpen(true)}
            className="min-h-[48px] py-2.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200"
          >
            <Utensils className="w-4 h-4" />
            <span className="truncate">{t('animals.add_feed_btn')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsProdModalOpen(true)}
            className="min-h-[48px] py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200"
          >
            <Egg className="w-4 h-4" />
            <span className="truncate">{t('animals.add_production_btn')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 pt-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`flex-1 py-3 text-base font-extrabold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'health'
              ? 'border-farm-cyan text-farm-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('animals.health_tab')} ({healthRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 text-base font-extrabold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'feed'
              ? 'border-farm-cyan text-farm-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('animals.feed_tab')} ({feedRecords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('production')}
          className={`flex-1 py-3 text-base font-extrabold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'production'
              ? 'border-farm-cyan text-farm-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('animals.production_tab')} ({productionRecords.length})
        </button>
      </div>

      {/* Tab Content 1: Health & Vaccines */}
      {activeTab === 'health' && (
        <div className="space-y-3">
          {healthRecords.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-600">No medical/vaccine treatments logged.</p>
              <button
                type="button"
                onClick={() => setIsHealthModalOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-farm-navy text-white font-bold text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-farm-cyan" />
                <span>Log Vaccine / Treatment</span>
              </button>
            </div>
          ) : (
            healthRecords.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-lg shrink-0">
                    💉
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-farm-navy">
                      {item.product}
                    </div>
                    <div className="text-xs font-bold text-rose-700 uppercase">
                      {item.type}
                    </div>
                    {item.nextDueDate && (
                      <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 mt-1">
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Next Due: {item.nextDueDate}</span>
                      </div>
                    )}
                    {item.notes && <p className="text-xs text-slate-500 italic mt-0.5">"{item.notes}"</p>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-farm-navy">${item.cost}</div>
                  <div className="text-xs text-slate-400 font-bold">{item.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Feed */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {feedRecords.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-600">No feed logs recorded.</p>
              <button
                type="button"
                onClick={() => setIsFeedModalOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-farm-navy text-white font-bold text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-farm-cyan" />
                <span>Log Feed</span>
              </button>
            </div>
          ) : (
            feedRecords.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shrink-0">
                    🌾
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-farm-navy">
                      {item.feedType}
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-farm-navy">${item.cost}</div>
                  <div className="text-xs text-slate-400 font-bold">{item.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 3: Production */}
      {activeTab === 'production' && (
        <div className="space-y-3">
          {productionRecords.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Egg className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-600">No production logs yet.</p>
              <button
                type="button"
                onClick={() => setIsProdModalOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-farm-navy text-white font-bold text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-farm-cyan" />
                <span>Log Eggs / Milk / Meat</span>
              </button>
            </div>
          ) : (
            productionRecords.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                    🥚
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-farm-navy">
                      {item.productType}
                    </div>
                    <div className="text-sm font-bold text-emerald-800">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 font-bold">{item.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODALS */}
      <AddAnimalHealthModal
        isOpen={isHealthModalOpen}
        animals={[animal]}
        selectedAnimalId={animal.id}
        onClose={() => setIsHealthModalOpen(false)}
        onSaved={() => {
          setIsHealthModalOpen(false);
          loadAnimalData();
          setConfirmMsg('Health record saved!');
        }}
      />

      <AddAnimalFeedModal
        isOpen={isFeedModalOpen}
        animals={[animal]}
        selectedAnimalId={animal.id}
        onClose={() => setIsFeedModalOpen(false)}
        onSaved={() => {
          setIsFeedModalOpen(false);
          loadAnimalData();
          setConfirmMsg('Feed log recorded!');
        }}
      />

      <AddAnimalProductionModal
        isOpen={isProdModalOpen}
        animals={[animal]}
        selectedAnimalId={animal.id}
        onClose={() => setIsProdModalOpen(false)}
        onSaved={() => {
          setIsProdModalOpen(false);
          loadAnimalData();
          setConfirmMsg('Production log recorded!');
        }}
      />

      <EditAnimalBatchModal
        isOpen={isEditModalOpen}
        farm={farm}
        animal={animal}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          setIsEditModalOpen(false);
          onRefresh();
          setConfirmMsg('Livestock batch updated successfully!');
        }}
        onDeleted={() => {
          setIsEditModalOpen(false);
          onRefresh();
          onBack();
        }}
      />

      <ConfirmationModal
        isOpen={!!confirmMsg}
        title={t('common.saved')}
        message={confirmMsg || ''}
        onClose={() => setConfirmMsg(null)}
      />
    </div>
  );
};
