import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Sprout,
  Wheat,
  PawPrint,
  Droplet,
  BellRing,
  DollarSign,
  TrendingUp,
  MessageSquareQuote,
  ArrowRight,
  AlertCircle,
  Calendar,
  Layers,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import {
  Farm,
  CropCycle,
  InputRecord,
  YieldRecord,
  Animal,
  AnimalHealthRecord,
  Tool,
} from '../../types';
import { AddCropCycleModal } from '../crops/AddCropCycleModal';
import { AddCropInputModal } from '../crops/AddCropInputModal';
import { AddCropYieldModal } from '../crops/AddCropYieldModal';
import { AddAnimalBatchModal } from '../animals/AddAnimalBatchModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { BlobThumbnail } from '../common/BlobThumbnail';
import { NavTab } from '../common/BottomNav';

interface HomeDashboardProps {
  farm: Farm;
  onChangeTab: (tab: NavTab) => void;
  onSelectCrop?: (cycleId: string) => void;
  onSelectAnimal?: (animalId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  farm,
  onChangeTab,
  onSelectCrop,
  onSelectAnimal,
}) => {
  const { t } = useTranslation();

  // Data states
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [inputRecords, setInputRecords] = useState<InputRecord[]>([]);
  const [yieldRecords, setYieldRecords] = useState<YieldRecord[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthRecords, setHealthRecords] = useState<AnimalHealthRecord[]>([]);
  const [toolsCount, setToolsCount] = useState<number>(0);

  // Quick action modals
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false);
  const [isAddInputOpen, setIsAddInputOpen] = useState(false);
  const [isAddYieldOpen, setIsAddYieldOpen] = useState(false);
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);

  // Confirmation feedback
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    const [c, i, y, a, h, tList] = await Promise.all([
      db.cropCycles.toArray(),
      db.inputRecords.toArray(),
      db.yieldRecords.toArray(),
      db.animals.toArray(),
      db.animalHealthRecords.toArray(),
      db.tools.count(),
    ]);

    setCropCycles(c);
    setInputRecords(i);
    setYieldRecords(y);
    setAnimals(a);
    setHealthRecords(h);
    setToolsCount(tList);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute Upcoming tasks (nextDueDate within 14 days or overdue)
  const now = new Date();
  const upcomingAlerts = healthRecords
    .filter((h) => h.nextDueDate)
    .map((h) => {
      const due = new Date(h.nextDueDate!);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const animal = animals.find((a) => a.id === h.animalId);
      return {
        id: h.id,
        title: `${h.product} (${h.type})`,
        targetName: animal ? `${animal.species} (${animal.batchSize} head)` : 'Livestock',
        dueDateStr: h.nextDueDate!,
        diffDays,
        isOverdue: diffDays < 0,
      };
    })
    .filter((alert) => alert.diffDays <= 14)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Compute Financials & totals
  const totalInputsSpent = inputRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalYieldBags = yieldRecords.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const activeCropsCount = cropCycles.filter((c) => c.status === 'active').length;
  const totalLivestockHead = animals.reduce((acc, curr) => acc + (curr.batchSize || 0), 0);

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* 1. QUICK-ADD STRIP (4 Large Buttons: Crop, Input, Yield, Animal) */}
      <section id="dashboard-quick-add-strip">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xl sm:text-2xl font-black text-farm-navy tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-farm-cyan stroke-[2.5]" />
            <span>{t('dashboard.quick_add_title')}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            3-Tap Quick Log
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Quick 1: Add Crop */}
          <button
            type="button"
            id="quick-add-crop-btn"
            onClick={() => setIsAddCycleOpen(true)}
            className="min-h-[76px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sprout className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_crop')}
            </span>
          </button>

          {/* Quick 2: Add Input */}
          <button
            type="button"
            id="quick-add-input-btn"
            onClick={() => setIsAddInputOpen(true)}
            className="min-h-[76px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Droplet className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_input')}
            </span>
          </button>

          {/* Quick 3: Add Yield */}
          <button
            type="button"
            id="quick-add-yield-btn"
            onClick={() => setIsAddYieldOpen(true)}
            className="min-h-[76px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wheat className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_yield')}
            </span>
          </button>

          {/* Quick 4: Add Animal */}
          <button
            type="button"
            id="quick-add-animal-btn"
            onClick={() => setIsAddAnimalOpen(true)}
            className="min-h-[76px] p-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PawPrint className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_animal')}
            </span>
          </button>
        </div>
      </section>

      {/* 2. UPCOMING TASKS & HEALTH ALERTS */}
      <section id="dashboard-upcoming-section" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-farm-navy flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-500 stroke-[2.4]" />
            <span>{t('dashboard.upcoming_title')}</span>
          </h3>
          {upcomingAlerts.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
              {upcomingAlerts.length} Due Soon
            </span>
          )}
        </div>

        {upcomingAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-base font-semibold text-slate-600">
              {t('dashboard.no_upcoming')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add booster or vaccine due dates in Animals → Health to track automatic reminders.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  alert.isOverdue
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.isOverdue ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-base font-extrabold leading-snug">
                      {alert.title}
                    </div>
                    <div className="text-sm font-medium opacity-85">
                      {alert.targetName} • Due: {alert.dueDateStr}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wide shrink-0 ${
                    alert.isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-950'
                  }`}
                >
                  {alert.isOverdue ? 'Overdue' : alert.diffDays === 0 ? 'Today' : `${alert.diffDays}d left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. FARM METRICS & SPEND OVERVIEW */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Active Crops */}
        <div
          onClick={() => onChangeTab('crops')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-farm-cyan transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">{t('dashboard.active_cycles')}</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-farm-navy">
            {activeCropsCount}
          </div>
          <span className="text-xs text-slate-500 font-semibold mt-0.5 block truncate">
            {farm.size} {farm.sizeUnit} total
          </span>
        </div>

        {/* Metric 2: Livestock Head */}
        <div
          onClick={() => onChangeTab('animals')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-farm-cyan transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">{t('dashboard.total_animals')}</span>
            <PawPrint className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-farm-navy">
            {totalLivestockHead}
          </div>
          <span className="text-xs text-slate-500 font-semibold mt-0.5 block truncate">
            {animals.length} batches
          </span>
        </div>

        {/* Metric 3: Total Inputs Spent */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">{t('dashboard.total_spent')}</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-farm-navy">
            ${totalInputsSpent.toFixed(0)}
          </div>
          <span className="text-xs text-slate-500 font-semibold mt-0.5 block truncate">
            {inputRecords.length} records
          </span>
        </div>

        {/* Metric 4: Total Harvested */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">{t('dashboard.total_harvest')}</span>
            <Wheat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-farm-navy">
            {totalYieldBags}
          </div>
          <span className="text-xs text-slate-500 font-semibold mt-0.5 block truncate">
            Units harvested
          </span>
        </div>
      </section>

      {/* 4. ACTIVE CROP CYCLES OVERVIEW LIST */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-farm-navy flex items-center gap-2">
            <Wheat className="w-5 h-5 text-emerald-600" />
            <span>{t('crops.active_crops')}</span>
          </h3>
          <button
            type="button"
            onClick={() => onChangeTab('crops')}
            className="text-sm font-bold text-farm-cyan hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('common.view_details')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {cropCycles.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
            <p className="text-base font-semibold text-slate-600 mb-3">
              {t('crops.no_crops_yet')}
            </p>
            <button
              type="button"
              onClick={() => setIsAddCycleOpen(true)}
              className="inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-farm-navy text-farm-cyan font-bold text-base shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{t('crops.new_crop_btn')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cropCycles.slice(0, 3).map((cycle) => {
              const plantDate = new Date(cycle.plantingDate);
              const daysGrowing = Math.floor((now.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));
              const cycleInputs = inputRecords.filter((i) => i.cropCycleId === cycle.id);
              const cycleSpend = cycleInputs.reduce((acc, curr) => acc + (curr.cost || 0), 0);

              return (
                <div
                  key={cycle.id}
                  onClick={() => {
                    onChangeTab('crops');
                    if (onSelectCrop) onSelectCrop(cycle.id);
                  }}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 hover:border-farm-cyan hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BlobThumbnail
                      blob={cycle.photo}
                      fallbackEmoji="🌾"
                      fallbackBgClass="bg-emerald-100 text-emerald-800"
                      alt={cycle.cropType}
                      className="w-12 h-12 rounded-xl shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-base sm:text-lg font-black text-farm-navy truncate">
                        {cycle.cropType} {cycle.variety ? `• ${cycle.variety}` : ''}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 font-semibold truncate">
                        {cycle.fieldId} • {t('crops.days_old', { days: Math.max(0, daysGrowing) })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-extrabold text-farm-navy">
                      ${cycleSpend.toFixed(0)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold">
                      {cycleInputs.length} inputs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. FARMCHAT CALLOUT BANNER */}
      <section
        id="dashboard-farmchat-banner"
        onClick={() => onChangeTab('farmchat')}
        className="p-5 rounded-2xl bg-gradient-to-r from-farm-navy via-farm-navy to-slate-900 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all border border-farm-cyan/30 flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-farm-cyan text-farm-navy flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
            <MessageSquareQuote className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-black text-farm-cyan uppercase tracking-wider mb-0.5">
              Instant Advisory
            </div>
            <h4 className="text-lg sm:text-xl font-black text-white leading-tight">
              {t('farmchat.title')}
            </h4>
            <p className="text-sm text-slate-300 font-medium line-clamp-1">
              {t('dashboard.farm_chat_prompt')}
            </p>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0 group-hover:bg-farm-cyan group-hover:text-farm-navy transition-colors">
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </div>
      </section>

      {/* MODALS */}
      <AddCropCycleModal
        isOpen={isAddCycleOpen}
        farm={farm}
        onClose={() => setIsAddCycleOpen(false)}
        onSaved={(c) => {
          setIsAddCycleOpen(false);
          loadDashboardData();
          setConfirmationMessage(`Crop "${c.cropType}" recorded successfully!`);
        }}
      />

      <AddCropInputModal
        isOpen={isAddInputOpen}
        farm={farm}
        activeCycles={cropCycles}
        onClose={() => setIsAddInputOpen(false)}
        onSaved={(i) => {
          setIsAddInputOpen(false);
          loadDashboardData();
          setConfirmationMessage(`${i.subtype} input recorded successfully!`);
        }}
      />

      <AddCropYieldModal
        isOpen={isAddYieldOpen}
        farm={farm}
        activeCycles={cropCycles}
        onClose={() => setIsAddYieldOpen(false)}
        onSaved={(y) => {
          setIsAddYieldOpen(false);
          loadDashboardData();
          setConfirmationMessage(`${y.quantity} ${y.unit} harvest yield recorded!`);
        }}
      />

      <AddAnimalBatchModal
        isOpen={isAddAnimalOpen}
        farm={farm}
        onClose={() => setIsAddAnimalOpen(false)}
        onSaved={(a) => {
          setIsAddAnimalOpen(false);
          loadDashboardData();
          setConfirmationMessage(`${a.batchSize} head of ${a.species} recorded!`);
        }}
      />

      {/* Confirmation Feedback */}
      <ConfirmationModal
        isOpen={!!confirmationMessage}
        title={t('common.saved')}
        message={confirmationMessage || ''}
        onClose={() => setConfirmationMessage(null)}
      />
    </div>
  );
};
