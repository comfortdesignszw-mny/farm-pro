import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Wheat,
  BookOpen,
  Calendar,
  ArrowRight,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  Sprout,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { CropCycle, CropCategory, Farm } from '../../types';
import { CropGuideModal } from './CropGuideModal';
import { AddCropCycleModal } from './AddCropCycleModal';
import { EditCropCycleModal } from './EditCropCycleModal';
import { CropDetailView } from './CropDetailView';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { BlobThumbnail } from '../common/BlobThumbnail';
import { shareCropDetails } from '../../utils/shareUtils';

interface CropsModuleProps {
  farm: Farm;
  selectedCycleId?: string | null;
  onClearSelectedCrop?: () => void;
}

export const CropsModule: React.FC<CropsModuleProps> = ({
  farm,
  selectedCycleId,
  onClearSelectedCrop,
}) => {
  const { t } = useTranslation();
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<CropCycle | null>(null);

  // Guide modal & Add cycle states
  const [selectedGuideCrop, setSelectedGuideCrop] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cropToAdd, setCropToAdd] = useState<string | null>(null);
  const [editingCycle, setEditingCycle] = useState<CropCycle | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const cropCategoriesList: { id: string; label: string; icon: string; emoji: string }[] = [
    { id: 'Maize', label: 'Maize (Chibage)', icon: '🌽', emoji: '🌽' },
    { id: 'Groundnuts', label: 'Groundnuts (Nzungu)', icon: '🥜', emoji: '🥜' },
    { id: 'Tomatoes', label: 'Tomatoes (Madomasi)', icon: '🍅', emoji: '🍅' },
    { id: 'Soybeans', label: 'Soybeans (Soya)', icon: '🌿', emoji: '🌿' },
    { id: 'Cabbage', label: 'Cabbage (Makabichi)', icon: '🥬', emoji: '🥬' },
    { id: 'Sorghum', label: 'Sorghum (Mapfunde)', icon: '🌾', emoji: '🌾' },
    { id: 'Potatoes', label: 'Irish Potatoes', icon: '🥔', emoji: '🥔' },
    { id: 'Wheat', label: 'Wheat (Gorosi)', icon: '🌾', emoji: '🌾' },
    { id: 'Fine Beans', label: 'Fine Beans (Bhinzi)', icon: '🫘', emoji: '🫘' },
    { id: 'Vegetables', label: 'Vegetables (Muriwo)', icon: '🥗', emoji: '🥗' },
    { id: 'Fruits', label: 'Fruits (Michero)', icon: '🍎', emoji: '🍎' },
    { id: 'Other', label: 'Other (Custom)', icon: '✏️', emoji: '🌱' },
  ];

  const getCropEmoji = (cropType: string): string => {
    const lower = cropType.toLowerCase();
    if (lower.includes('maize') || lower.includes('chibage')) return '🌽';
    if (lower.includes('nut') || lower.includes('nzungu') || lower.includes('peanut')) return '🥜';
    if (lower.includes('tomato') || lower.includes('domasi')) return '🍅';
    if (lower.includes('soya') || lower.includes('soybean')) return '🌿';
    if (lower.includes('cabbage') || lower.includes('kabichi')) return '🥬';
    if (lower.includes('sorghum') || lower.includes('mapfunde')) return '🌾';
    if (lower.includes('potato') || lower.includes('mbambaira')) return '🥔';
    if (lower.includes('wheat') || lower.includes('gorosi')) return '🌾';
    if (lower.includes('bean') || lower.includes('bhinzi') || lower.includes('nyemba')) return '🫘';
    if (lower.includes('veg') || lower.includes('rape') || lower.includes('covo') || lower.includes('spinach') || lower.includes('muriwo')) return '🥗';
    if (lower.includes('fruit') || lower.includes('mango') || lower.includes('banana') || lower.includes('citrus') || lower.includes('avocado')) return '🍎';
    return '🌱';
  };

  const loadCycles = async () => {
    const list = await db.cropCycles.toArray();
    setCycles(list.sort((a, b) => b.createdAt - a.createdAt));

    if (selectedCycleId) {
      const found = list.find((c) => c.id === selectedCycleId);
      if (found) setActiveCycle(found);
    }
  };

  useEffect(() => {
    loadCycles();
  }, [selectedCycleId]);

  const handleShare = async (e: React.MouseEvent, cycle: CropCycle) => {
    e.stopPropagation();
    const res = await shareCropDetails(cycle, farm);
    if (res.message) {
      setConfirmMsg(res.message);
    }
  };

  const handleEdit = (e: React.MouseEvent, cycle: CropCycle) => {
    e.stopPropagation();
    setEditingCycle(cycle);
  };

  const handleDelete = async (e: React.MouseEvent, cycle: CropCycle) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${cycle.cropType}" and its associated input and yield logs?`)) {
      await db.cropCycles.delete(cycle.id);
      await db.inputRecords.where('cropCycleId').equals(cycle.id).delete();
      await db.yieldRecords.where('cropCycleId').equals(cycle.id).delete();
      loadCycles();
      setConfirmMsg(`Crop cycle "${cycle.cropType}" deleted.`);
    }
  };

  if (activeCycle) {
    return (
      <div className="pb-24 max-w-4xl mx-auto px-3 sm:px-4 py-4">
        <CropDetailView
          cycle={activeCycle}
          farm={farm}
          onBack={() => {
            setActiveCycle(null);
            if (onClearSelectedCrop) onClearSelectedCrop();
          }}
          onRefresh={loadCycles}
        />
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-6">
      {/* Header with Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-farm-navy">
            {t('crops.title')}
          </h2>
          <p className="text-sm font-semibold text-slate-600">
            {cycles.length} crop cycles recorded on {farm.name}
          </p>
        </div>

        <button
          type="button"
          id="new-crop-cycle-header-btn"
          onClick={() => {
            setCropToAdd('Maize');
            setIsAddModalOpen(true);
          }}
          className="min-h-[48px] px-4 py-2.5 rounded-xl bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-farm-cyan" />
          <span>{t('crops.new_crop_btn')}</span>
        </button>
      </div>

      {/* 1. CROP ADVISORY & MANAGEMENT GUIDE GRID (Tap for Guide / Plant) */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-base sm:text-lg font-bold text-farm-navy flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>Crop Guides & Categories (Tap for Guide)</span>
          </h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {cropCategoriesList.map((item) => {
            const hasRegistered = cycles.some(
              (c) => c.cropType.toLowerCase() === item.id.toLowerCase() || (item.id === 'Other' && !cropCategoriesList.some(cat => cat.id !== 'Other' && cat.id.toLowerCase() === c.cropType.toLowerCase()))
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGuideCrop(item.id)}
                className={`min-h-[84px] sm:min-h-[96px] p-2.5 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                  hasRegistered
                    ? 'bg-emerald-50/80 border-emerald-300 text-farm-navy'
                    : 'bg-white border-slate-200 hover:border-emerald-500 text-slate-800'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-xs sm:text-sm font-extrabold leading-tight line-clamp-2">
                  {item.label}
                </span>
                {hasRegistered && (
                  <span className="text-[10px] sm:text-[11px] font-black text-emerald-700 mt-0.5">
                    ✓ In Farm
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. MY REGISTERED CROP CYCLES */}
      <section className="space-y-3">
        <h3 className="text-base sm:text-xl font-bold text-farm-navy flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-600" />
          <span>My Farm Crop Cycles ({cycles.length})</span>
        </h3>

        {cycles.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-dashed border-slate-300 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center text-3xl">
              🌾
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-farm-navy mb-1">
                No crops planted yet
              </h3>
              <p className="text-base text-slate-600">
                {t('crops.no_crops_yet')} Tap any crop above to view the management guide or add a new cycle.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCropToAdd('Maize');
                setIsAddModalOpen(true);
              }}
              className="min-h-[50px] px-6 py-3 rounded-xl bg-farm-cyan hover:bg-farm-cyan-light text-farm-navy font-extrabold text-base flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>{t('crops.new_crop_btn')}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {cycles.map((c) => {
              const plantDate = new Date(c.plantingDate);
              const daysGrowing = Math.floor((Date.now() - plantDate.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveCycle(c)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-farm-cyan shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top: Image & Crop Info */}
                    <div className="flex items-start justify-between gap-2.5 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Visible uploaded image or custom thumbnail */}
                        <BlobThumbnail
                          blob={c.photo}
                          fallbackEmoji={getCropEmoji(c.cropType)}
                          fallbackBgClass="bg-emerald-100 text-emerald-800"
                          alt={c.cropType}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0"
                        />

                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-black text-farm-navy truncate">
                            {c.cropType}
                          </h3>
                          {c.variety && (
                            <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md truncate max-w-[140px] sm:max-w-[180px]">
                              {c.variety}
                            </span>
                          )}
                          <p className="text-xs sm:text-sm font-semibold text-slate-600 truncate mt-0.5">
                            {c.fieldId} • {c.fieldSize || farm.size} {farm.sizeUnit}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : c.status === 'harvested'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Growth Status & Details */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 bg-slate-50 p-2 rounded-xl">
                      <span className="text-emerald-700">
                        {t('crops.days_old', { days: Math.max(0, daysGrowing) })}
                      </span>
                      <span className="text-slate-500">
                        Planted: {c.plantingDate}
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
                        onClick={(e) => handleEdit(e, c)}
                        title="Edit Crop Cycle"
                        className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-farm-navy font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-farm-navy" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, c)}
                        title="Delete Crop Cycle"
                        className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      {/* Share Button (With Meta Tags) */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(e, c)}
                        title="Share Crop Details & Meta Tags"
                        className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 active:bg-cyan-200 text-cyan-900 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5 text-farm-cyan" />
                        <span>Share</span>
                      </button>
                    </div>

                    {/* Right: View Logs Link */}
                    <div className="flex items-center gap-1 text-farm-cyan font-extrabold text-xs ml-auto">
                      <span>{t('common.view_details')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CROP GUIDE MODAL */}
      <CropGuideModal
        crop={selectedGuideCrop}
        isOpen={!!selectedGuideCrop}
        onClose={() => setSelectedGuideCrop(null)}
        onPlantCrop={(crop) => {
          setSelectedGuideCrop(null);
          setCropToAdd(crop || 'Maize');
          setIsAddModalOpen(true);
        }}
      />

      {/* Add Modal */}
      <AddCropCycleModal
        isOpen={isAddModalOpen}
        farm={farm}
        defaultCropType={cropToAdd}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={(c) => {
          setIsAddModalOpen(false);
          loadCycles();
          setConfirmMsg(`Crop cycle "${c.cropType}" recorded!`);
        }}
      />

      {/* Edit Modal */}
      <EditCropCycleModal
        isOpen={!!editingCycle}
        farm={farm}
        cycle={editingCycle}
        onClose={() => setEditingCycle(null)}
        onSaved={(c) => {
          setEditingCycle(null);
          loadCycles();
          setConfirmMsg(`Crop cycle "${c.cropType}" updated!`);
        }}
        onDeleted={() => {
          setEditingCycle(null);
          loadCycles();
          setConfirmMsg('Crop cycle deleted.');
        }}
      />

      {/* Confirmation Feedback */}
      <ConfirmationModal
        isOpen={!!confirmMsg}
        title={t('common.saved')}
        message={confirmMsg || ''}
        onClose={() => setConfirmMsg(null)}
      />
    </div>
  );
};

