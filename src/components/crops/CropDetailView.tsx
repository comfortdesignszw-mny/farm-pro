import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Wheat,
  Droplet,
  DollarSign,
  PlusCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Tag,
  Trash2,
  Share2,
  Edit2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { CropCycle, InputRecord, YieldRecord, Farm } from '../../types';
import { AddCropInputModal } from './AddCropInputModal';
import { AddCropYieldModal } from './AddCropYieldModal';
import { EditCropCycleModal } from './EditCropCycleModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { shareCropDetails } from '../../utils/shareUtils';

interface CropDetailViewProps {
  cycle: CropCycle;
  farm: Farm;
  onBack: () => void;
  onRefresh: () => void;
}

export const CropDetailView: React.FC<CropDetailViewProps> = ({
  cycle,
  farm,
  onBack,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'inputs' | 'yield' | 'timeline'>('inputs');
  const [inputs, setInputs] = useState<InputRecord[]>([]);
  const [yields, setYields] = useState<YieldRecord[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick logging modals
  const [isAddInputOpen, setIsAddInputOpen] = useState(false);
  const [isAddYieldOpen, setIsAddYieldOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const loadCycleRecords = async () => {
    const [iList, yList] = await Promise.all([
      db.inputRecords.where('cropCycleId').equals(cycle.id).toArray(),
      db.yieldRecords.where('cropCycleId').equals(cycle.id).toArray(),
    ]);

    setInputs(iList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setYields(yList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    loadCycleRecords();
    if (cycle.photo) {
      const url = URL.createObjectURL(cycle.photo);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [cycle]);

  const totalCost = inputs.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalYield = yields.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

  const plantDate = new Date(cycle.plantingDate);
  const daysGrowing = Math.floor((Date.now() - plantDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleShare = async () => {
    const res = await shareCropDetails(cycle, farm);
    if (res.message) setConfirmMsg(res.message);
  };

  const handleDeleteCycle = async () => {
    if (confirm('Are you sure you want to delete this crop cycle and its associated records?')) {
      await db.cropCycles.delete(cycle.id);
      await db.inputRecords.where('cropCycleId').equals(cycle.id).delete();
      await db.yieldRecords.where('cropCycleId').equals(cycle.id).delete();
      onRefresh();
      onBack();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
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
            onClick={handleDeleteCycle}
            className="min-h-[44px] px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.delete')}</span>
          </button>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={cycle.cropType}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-black shrink-0">
                🌾
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-farm-navy">
                  {cycle.cropType}
                </h2>
                {cycle.variety && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                    {cycle.variety}
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-slate-600 mt-0.5">
                {cycle.fieldId} • {cycle.fieldSize || farm.size} {farm.sizeUnit}
              </p>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Planted: {cycle.plantingDate}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-extrabold">
                  {t('crops.days_old', { days: Math.max(0, daysGrowing) })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 sm:w-64">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">
                {t('common.cost')}
              </div>
              <div className="text-xl font-black text-farm-navy">
                ${totalCost.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">
                {t('common.yield')}
              </div>
              <div className="text-xl font-black text-emerald-700">
                {totalYield}
              </div>
            </div>
          </div>
        </div>

        {/* 2 Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsAddInputOpen(true)}
            className="min-h-[50px] py-3 px-4 rounded-xl bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-5 h-5 text-farm-cyan" />
            <span>{t('crops.add_input_btn')}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddYieldOpen(true)}
            className="min-h-[50px] py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-5 h-5 text-emerald-200" />
            <span>{t('crops.add_yield_btn')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 pt-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('inputs')}
          className={`flex-1 py-3 text-base font-extrabold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inputs'
              ? 'border-farm-cyan text-farm-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('crops.inputs_tab')} ({inputs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('yield')}
          className={`flex-1 py-3 text-base font-extrabold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'yield'
              ? 'border-farm-cyan text-farm-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('crops.yield_tab')} ({yields.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-3 text-base font-extrabold text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-farm-cyan text-farm-navy'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('crops.timeline_tab')}
        </button>
      </div>

      {/* Tab Content 1: Inputs */}
      {activeTab === 'inputs' && (
        <div className="space-y-3">
          {inputs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-600">No inputs logged yet.</p>
              <button
                type="button"
                onClick={() => setIsAddInputOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-farm-cyan text-farm-navy font-bold text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log First Input</span>
              </button>
            </div>
          ) : (
            inputs.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-lg shrink-0">
                    {item.type === 'fertilizer' ? '🌱' : item.type === 'seed' ? '🌾' : item.type === 'spray' ? '🧪' : '👥'}
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-farm-navy">
                      {item.subtype}
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      {item.quantity} {item.unit} • {item.quantityPerHectare} {item.unit}/{farm.sizeUnit}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 italic">"{item.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-farm-navy">
                    ${item.cost}
                  </div>
                  <div className="text-xs text-slate-400 font-bold">
                    {item.date}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Yield */}
      {activeTab === 'yield' && (
        <div className="space-y-3">
          {yields.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Wheat className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-600">No harvests logged yet.</p>
              <button
                type="button"
                onClick={() => setIsAddYieldOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Harvest Yield</span>
              </button>
            </div>
          ) : (
            yields.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                    🌾
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-farm-navy">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      Rate: {item.quantityPerHectare} {item.unit}/{farm.sizeUnit}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 italic">"{item.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 font-bold">
                    Harvested: {item.date}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 3: Timeline & Agronomy Guide */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-farm-navy">
            Agronomy Schedule for {cycle.cropType}
          </h3>
          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200" />
              <div className="text-sm font-bold text-farm-navy">Day 0: Planting & Basal Fertilizer</div>
              <p className="text-xs text-slate-600">Apply basal Compound D in furrows and plant certified seed.</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white ring-2 ring-slate-100" />
              <div className="text-sm font-bold text-farm-navy">Weeks 2–4: First Weeding & Pest Scouting</div>
              <p className="text-xs text-slate-600">Keep field weed-free; scout for stalk borer or fall armyworm.</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white ring-2 ring-slate-100" />
              <div className="text-sm font-bold text-farm-navy">Weeks 5–6: Top Dressing (Ammonium Nitrate)</div>
              <p className="text-xs text-slate-600">Side dress with nitrogen fertilizer at knee-height before rain.</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white ring-2 ring-slate-100" />
              <div className="text-sm font-bold text-farm-navy">Expected Harvest: {cycle.harvestDateExpected}</div>
              <p className="text-xs text-slate-600">Dry properly down to 12.5% moisture for long-term storage.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddCropInputModal
        isOpen={isAddInputOpen}
        farm={farm}
        activeCycles={[cycle]}
        selectedCycleId={cycle.id}
        onClose={() => setIsAddInputOpen(false)}
        onSaved={(i) => {
          setIsAddInputOpen(false);
          loadCycleRecords();
          setConfirmMsg(`${i.subtype} input recorded!`);
        }}
      />

      <AddCropYieldModal
        isOpen={isAddYieldOpen}
        farm={farm}
        activeCycles={[cycle]}
        selectedCycleId={cycle.id}
        onClose={() => setIsAddYieldOpen(false)}
        onSaved={(y) => {
          setIsAddYieldOpen(false);
          loadCycleRecords();
          setConfirmMsg(`${y.quantity} ${y.unit} harvest recorded!`);
        }}
      />

      <EditCropCycleModal
        isOpen={isEditModalOpen}
        farm={farm}
        cycle={cycle}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {
          setIsEditModalOpen(false);
          onRefresh();
          setConfirmMsg('Crop record updated successfully!');
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
