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
  CalendarPlus,
  Layers,
  Wrench,
  CheckCircle2,
  Clock,
  Trash2,
  Syringe,
  Bug,
  Sparkles,
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
  FarmTask,
} from '../../types';
import { AddCropCycleModal } from '../crops/AddCropCycleModal';
import { AddCropInputModal } from '../crops/AddCropInputModal';
import { AddCropYieldModal } from '../crops/AddCropYieldModal';
import { AddAnimalBatchModal } from '../animals/AddAnimalBatchModal';
import { AddQuickTaskModal } from './AddQuickTaskModal';
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
  const [farmTasks, setFarmTasks] = useState<FarmTask[]>([]);
  const [toolsCount, setToolsCount] = useState<number>(0);

  // Quick action modals
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false);
  const [isAddInputOpen, setIsAddInputOpen] = useState(false);
  const [isAddYieldOpen, setIsAddYieldOpen] = useState(false);
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Task filter state
  const [taskFilter, setTaskFilter] = useState<'all' | 'crop' | 'animal' | 'completed'>('all');

  // Confirmation feedback
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  const loadDashboardData = async () => {
    const [c, i, y, a, h, tList, tasks] = await Promise.all([
      db.cropCycles.toArray(),
      db.inputRecords.toArray(),
      db.yieldRecords.toArray(),
      db.animals.toArray(),
      db.animalHealthRecords.toArray(),
      db.tools.count(),
      db.farmTasks.toArray(),
    ]);

    setCropCycles(c);
    setInputRecords(i);
    setYieldRecords(y);
    setAnimals(a);
    setHealthRecords(h);
    setToolsCount(tList);
    setFarmTasks(tasks);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleCompleteTask = async (task: FarmTask) => {
    const newStatus = !task.isCompleted;
    await db.farmTasks.update(task.id, {
      isCompleted: newStatus,
      completedAt: newStatus ? Date.now() : undefined,
    });
    await loadDashboardData();
    if (newStatus) {
      setConfirmationMessage(`Task "${task.title}" completed!`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await db.farmTasks.delete(taskId);
    await loadDashboardData();
  };

  // Compute Upcoming tasks & alerts
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Map user farmTasks
  const mappedTasks = farmTasks.map((t) => {
    const due = new Date(t.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: t.id,
      rawTask: t,
      isUserTask: true,
      title: t.title,
      targetType: t.targetType,
      targetName: t.targetName || (t.targetType === 'crop' ? 'Plant/Crop' : t.targetType === 'animal' ? 'Livestock' : 'General Farm'),
      dueDateStr: t.dueDate,
      diffDays,
      isOverdue: diffDays < 0 && !t.isCompleted,
      isCompleted: t.isCompleted,
      priority: t.priority,
      category: t.category,
    };
  });

  // Map animal vaccine/health reminders (if not already represented)
  const mappedHealthAlerts = healthRecords
    .filter((h) => h.nextDueDate)
    .map((h) => {
      const due = new Date(h.nextDueDate!);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const animal = animals.find((a) => a.id === h.animalId);
      return {
        id: h.id,
        rawTask: undefined,
        isUserTask: false,
        title: `${h.product} (${h.type})`,
        targetType: 'animal' as const,
        targetName: animal ? `${animal.species} (${animal.batchSize} head)` : 'Livestock',
        dueDateStr: h.nextDueDate!,
        diffDays,
        isOverdue: diffDays < 0,
        isCompleted: false,
        priority: 'high' as const,
        category: h.type === 'vaccination' ? ('vaccine' as const) : ('animal_health' as const),
      };
    });

  // Merge and filter
  const allAlertsAndTasks = [...mappedTasks, ...mappedHealthAlerts];

  const filteredTasks = allAlertsAndTasks
    .filter((item) => {
      if (taskFilter === 'completed') return item.isCompleted;
      if (item.isCompleted) return false; // In normal views, only show pending
      if (taskFilter === 'crop') return item.targetType === 'crop';
      if (taskFilter === 'animal') return item.targetType === 'animal';
      return true; // 'all'
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.diffDays - b.diffDays;
    });

  const pendingCount = allAlertsAndTasks.filter((t) => !t.isCompleted).length;
  const overdueCount = allAlertsAndTasks.filter((t) => t.isOverdue && !t.isCompleted).length;

  // Compute Financials & totals
  const totalInputsSpent = inputRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalYieldBags = yieldRecords.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const activeCropsCount = cropCycles.filter((c) => c.status === 'active').length;
  const totalLivestockHead = animals.reduce((acc, curr) => acc + (curr.batchSize || 0), 0);

  // Harvest Value calculations (Actual harvest value + Projected standing crop value)
  const totalHarvestValue = yieldRecords.reduce((acc, curr) => {
    if (curr.totalEstimatedValue && curr.totalEstimatedValue > 0) {
      return acc + curr.totalEstimatedValue;
    }
    if (curr.sellingPricePerUnit && curr.sellingPricePerUnit > 0) {
      return acc + curr.quantity * curr.sellingPricePerUnit;
    }
    const parentCycle = cropCycles.find((c) => c.id === curr.cropCycleId);
    if (parentCycle?.sellingPricePerUnit && parentCycle.sellingPricePerUnit > 0) {
      return acc + curr.quantity * parentCycle.sellingPricePerUnit;
    }
    return acc;
  }, 0);

  const standingCropEstimatedValue = cropCycles
    .filter((c) => c.status === 'active' && c.expectedYieldQuantity && c.sellingPricePerUnit)
    .reduce((acc, curr) => acc + (curr.expectedYieldQuantity || 0) * (curr.sellingPricePerUnit || 0), 0);

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* 1. QUICK-ADD STRIP (Crop, Input, Yield, Animal, Task) */}
      <section id="dashboard-quick-add-strip">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xl sm:text-2xl font-black text-farm-navy tracking-tight flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-farm-cyan stroke-[2.5]" />
            <span>{t('dashboard.quick_add_title')}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Fast Action Bar
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Quick 1: Add Crop */}
          <button
            type="button"
            id="quick-add-crop-btn"
            onClick={() => setIsAddCycleOpen(true)}
            className="min-h-[76px] p-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sprout className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_crop')}
            </span>
          </button>

          {/* Quick 2: Add Input */}
          <button
            type="button"
            id="quick-add-input-btn"
            onClick={() => setIsAddInputOpen(true)}
            className="min-h-[76px] p-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Droplet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_input')}
            </span>
          </button>

          {/* Quick 3: Add Yield */}
          <button
            type="button"
            id="quick-add-yield-btn"
            onClick={() => setIsAddYieldOpen(true)}
            className="min-h-[76px] p-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wheat className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_yield')}
            </span>
          </button>

          {/* Quick 4: Add Animal */}
          <button
            type="button"
            id="quick-add-animal-btn"
            onClick={() => setIsAddAnimalOpen(true)}
            className="min-h-[76px] p-3 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border-2 border-slate-200 hover:border-farm-cyan shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PawPrint className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-farm-navy leading-tight">
              {t('dashboard.add_animal')}
            </span>
          </button>

          {/* Quick 5: Add Health / Farm Task */}
          <button
            type="button"
            id="quick-add-task-strip-btn"
            onClick={() => setIsAddTaskOpen(true)}
            className="col-span-2 sm:col-span-1 min-h-[76px] p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 active:scale-[0.98] border-2 border-emerald-300 shadow-xs flex sm:flex-col items-center justify-center gap-2 sm:gap-1.5 transition-all text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <CalendarPlus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-black text-emerald-950 leading-tight">
              + Add Task / Health
            </span>
          </button>
        </div>
      </section>

      {/* 2. UPCOMING TASKS & PLANT / ANIMAL HEALTH ALERTS */}
      <section id="dashboard-upcoming-section" className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
        {/* Section Header with Direct Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-farm-navy">
                  Upcoming Tasks & Health Schedule
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900">
                    {pendingCount}
                  </span>
                )}
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
                    {overdueCount} Overdue
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Crop sprays, livestock booster vaccines, fertilizing, and field maintenance
              </p>
            </div>
          </div>

          {/* Prominent "+ Add Task or Health Task" Button */}
          <button
            type="button"
            id="dashboard-add-task-btn"
            onClick={() => setIsAddTaskOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-farm-navy hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <CalendarPlus className="w-4 h-4 text-farm-cyan" />
            <span>+ Add Task / Health</span>
          </button>
        </div>

        {/* Task Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
          <button
            type="button"
            onClick={() => setTaskFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              taskFilter === 'all'
                ? 'bg-farm-navy text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('crop')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              taskFilter === 'crop'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Plant / Crop Health</span>
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('animal')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              taskFilter === 'animal'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>Livestock Vaccines</span>
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('completed')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              taskFilter === 'completed'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="text-base font-extrabold text-slate-700">
              {taskFilter === 'completed'
                ? 'No completed tasks yet.'
                : 'No upcoming tasks or health reminders in this view.'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Schedule your next armyworm spray, fertilizer top dressing, or Newcastle vaccine booster to keep your farm on schedule.
            </p>
            <button
              type="button"
              onClick={() => setIsAddTaskOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-farm-navy hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-farm-cyan" />
              <span>Schedule Plant or Animal Health Task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((item) => {
              const isCrop = item.targetType === 'crop';
              const isAnimal = item.targetType === 'animal';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    item.isCompleted
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : item.isOverdue
                      ? 'bg-rose-50/80 border-rose-200 shadow-xs'
                      : item.diffDays <= 2
                      ? 'bg-amber-50/80 border-amber-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Interactive Completion Toggle */}
                    {item.isUserTask && item.rawTask ? (
                      <button
                        type="button"
                        onClick={() => handleToggleCompleteTask(item.rawTask!)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          item.isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 border border-slate-300'
                        }`}
                        title={item.isCompleted ? 'Mark as pending' : 'Mark task complete'}
                      >
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.isOverdue
                            ? 'bg-rose-200 text-rose-800'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span
                          className={`text-sm sm:text-base font-extrabold leading-snug truncate ${
                            item.isCompleted
                              ? 'line-through text-slate-500'
                              : item.isOverdue
                              ? 'text-rose-950'
                              : 'text-farm-navy'
                          }`}
                        >
                          {item.title}
                        </span>

                        {/* Priority Badge */}
                        {item.priority === 'high' && !item.isCompleted && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          {isCrop ? (
                            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isAnimal ? (
                            <PawPrint className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{item.targetName}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Due: {item.dueDateStr}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge & Delete Control */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wide shrink-0 ${
                        item.isCompleted
                          ? 'bg-slate-200 text-slate-700'
                          : item.isOverdue
                          ? 'bg-rose-600 text-white'
                          : item.diffDays === 0
                          ? 'bg-amber-500 text-white'
                          : item.diffDays <= 2
                          ? 'bg-amber-200 text-amber-950'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {item.isCompleted
                        ? 'Done'
                        : item.isOverdue
                        ? 'Overdue'
                        : item.diffDays === 0
                        ? 'Today'
                        : `${item.diffDays}d left`}
                    </span>

                    {item.isUserTask && item.rawTask && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(item.rawTask!.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

        {/* Metric 4: Total Harvested with Estimated Revenue */}
        <div
          onClick={() => onChangeTab('crops')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-farm-cyan transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">{t('dashboard.total_harvest')}</span>
            <Wheat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-farm-navy flex items-baseline gap-1">
            {totalYieldBags}
            <span className="text-xs font-bold text-slate-500 font-normal">units</span>
          </div>
          <div className="mt-1">
            {totalHarvestValue > 0 ? (
              <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-200 truncate max-w-full">
                <span>≈ ${totalHarvestValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} value</span>
              </div>
            ) : standingCropEstimatedValue > 0 ? (
              <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md inline-block truncate max-w-full border border-amber-200">
                Est. Field: ${standingCropEstimatedValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-semibold block truncate">
                {yieldRecords.length} harvest logs
              </span>
            )}
          </div>
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

      <AddQuickTaskModal
        isOpen={isAddTaskOpen}
        farm={farm}
        cropCycles={cropCycles}
        animals={animals}
        onClose={() => setIsAddTaskOpen(false)}
        onTaskAdded={(task) => {
          setIsAddTaskOpen(false);
          loadDashboardData();
          setConfirmationMessage(`Task "${task.title}" scheduled for ${task.dueDate}!`);
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
