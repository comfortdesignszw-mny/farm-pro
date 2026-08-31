import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Sprout,
  Syringe,
  Wrench,
  AlertCircle,
  Clock,
  Sparkles,
  Bug,
  Droplet,
  DollarSign,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Farm, CropCycle, Animal, FarmTask, TaskCategory } from '../../types';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddQuickTaskModalProps {
  isOpen: boolean;
  farm: Farm;
  cropCycles: CropCycle[];
  animals: Animal[];
  onClose: () => void;
  onTaskAdded: (task: FarmTask) => void;
}

export const AddQuickTaskModal: React.FC<AddQuickTaskModalProps> = ({
  isOpen,
  farm,
  cropCycles,
  animals,
  onClose,
  onTaskAdded,
}) => {
  const { t } = useTranslation();

  const [taskCategory, setTaskCategory] = useState<'crop' | 'animal' | 'general'>('crop');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(cropCycles[0]?.id || '');
  const [title, setTitle] = useState('');
  const [specificCategory, setSpecificCategory] = useState<TaskCategory>('crop_health');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // Default in 3 days
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Preset chips based on selected main category
  const cropPresets = [
    { title: 'Pest & Armyworm Spray (Ampligo / Belt)', cat: 'spray' as TaskCategory, priority: 'high' as const },
    { title: 'Top-Dressing Fertilizer (Ammonium Nitrate)', cat: 'fertilizer' as TaskCategory, priority: 'high' as const },
    { title: 'Blight & Rust Fungicide Spray', cat: 'crop_health' as TaskCategory, priority: 'medium' as const },
    { title: 'Weeding & Inter-row Cultivation', cat: 'weeding' as TaskCategory, priority: 'medium' as const },
    { title: 'Irrigation & Soil Moisture Check', cat: 'crop_health' as TaskCategory, priority: 'low' as const },
    { title: 'Harvest Preparation & Cob Drying Check', cat: 'harvest' as TaskCategory, priority: 'medium' as const },
  ];

  const animalPresets = [
    { title: 'Newcastle Lasota Booster Vaccine', cat: 'vaccine' as TaskCategory, priority: 'high' as const },
    { title: 'Deworming (Albendazole / Ivermectin)', cat: 'deworming' as TaskCategory, priority: 'high' as const },
    { title: 'Tick Dipping & Spraying', cat: 'animal_health' as TaskCategory, priority: 'high' as const },
    { title: 'Gumboro (IBD) Vaccine Booster', cat: 'vaccine' as TaskCategory, priority: 'high' as const },
    { title: 'Vitamin & Stress Pack Administration', cat: 'animal_health' as TaskCategory, priority: 'medium' as const },
    { title: 'Flock / Herd Weight & Health Inspection', cat: 'animal_health' as TaskCategory, priority: 'low' as const },
  ];

  const generalPresets = [
    { title: 'Knapsack Sprayer Nozzle & Seal Maintenance', cat: 'maintenance' as TaskCategory, priority: 'medium' as const },
    { title: 'Irrigation Pump & Pipes Inspection', cat: 'maintenance' as TaskCategory, priority: 'high' as const },
    { title: 'Poultry Shed / Kraal Disinfection & Cleaning', cat: 'maintenance' as TaskCategory, priority: 'medium' as const },
    { title: 'Perimeter Fence & Gate Security Check', cat: 'general' as TaskCategory, priority: 'low' as const },
  ];

  const handleQuickPreset = (preset: { title: string; cat: TaskCategory; priority: 'high' | 'medium' | 'low' }) => {
    setTitle(preset.title);
    setSpecificCategory(preset.cat);
    setPriority(preset.priority);
  };

  const handleSetQuickDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let targetName = 'General Farm';
      let targetType: 'crop' | 'animal' | 'tool' | 'general' = 'general';

      if (taskCategory === 'crop') {
        targetType = 'crop';
        const found = cropCycles.find((c) => c.id === selectedTargetId);
        targetName = found ? `${found.cropType} (${found.variety})` : 'Active Crop';
      } else if (taskCategory === 'animal') {
        targetType = 'animal';
        const found = animals.find((a) => a.id === selectedTargetId);
        targetName = found ? `${found.species} (${found.batchSize} head)` : 'Livestock Batch';
      } else {
        targetType = 'general';
        targetName = 'Farm Facility / Tools';
      }

      const newTask: FarmTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        farmId: farm.id,
        title: title.trim(),
        category: specificCategory,
        targetType,
        targetId: selectedTargetId || undefined,
        targetName,
        dueDate,
        isCompleted: false,
        priority,
        cost: estimatedCost ? Number(estimatedCost) : undefined,
        notes: notes.trim() || undefined,
        createdAt: Date.now(),
      };

      await db.farmTasks.put(newTask);

      // If it is a livestock health task, also save a reminder to animalHealthRecords if user specified target
      if (taskCategory === 'animal' && (specificCategory === 'vaccine' || specificCategory === 'deworming' || specificCategory === 'animal_health')) {
        const healthType = specificCategory === 'vaccine' ? 'vaccination' : specificCategory === 'deworming' ? 'deworming' : 'treatment';
        await db.animalHealthRecords.put({
          id: 'health_rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          animalId: selectedTargetId || (animals[0]?.id || 'default'),
          type: healthType,
          product: title.trim(),
          date: new Date().toISOString().split('T')[0],
          nextDueDate: dueDate,
          cost: estimatedCost ? Number(estimatedCost) : 0,
          notes: `Scheduled Task: ${notes.trim() || title.trim()}`,
          createdAt: Date.now(),
        });
      }

      onTaskAdded(newTask);
      onClose();
    } catch (err) {
      console.error('Error saving farm task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-farm-navy">
                Add Farm & Health Task
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Schedule plant sprays, livestock vaccines, or field maintenance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Category Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Task Target Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTaskCategory('crop');
                  setSelectedTargetId(cropCycles[0]?.id || '');
                  setSpecificCategory('crop_health');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  taskCategory === 'crop'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100'
                }`}
              >
                <Sprout className={`w-5 h-5 ${taskCategory === 'crop' ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span className="text-xs">Plant / Crop</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskCategory('animal');
                  setSelectedTargetId(animals[0]?.id || '');
                  setSpecificCategory('vaccine');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  taskCategory === 'animal'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100'
                }`}
              >
                <Syringe className={`w-5 h-5 ${taskCategory === 'animal' ? 'text-indigo-700' : 'text-slate-500'}`} />
                <span className="text-xs">Animal Health</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTaskCategory('general');
                  setSelectedTargetId('');
                  setSpecificCategory('maintenance');
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  taskCategory === 'general'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100'
                }`}
              >
                <Wrench className={`w-5 h-5 ${taskCategory === 'general' ? 'text-amber-700' : 'text-slate-500'}`} />
                <span className="text-xs">Maintenance</span>
              </button>
            </div>
          </div>

          {/* 2. Target Select Dropdown */}
          {taskCategory === 'crop' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Select Crop / Field
              </label>
              {cropCycles.length > 0 ? (
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-300 focus:border-emerald-600 outline-none bg-slate-50 text-farm-navy"
                >
                  {cropCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      🌱 {c.cropType} ({c.variety}) - Planted {c.plantingDate}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                  No active crop cycles registered yet. Task will apply to general field work.
                </div>
              )}
            </div>
          )}

          {taskCategory === 'animal' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Select Livestock Batch
              </label>
              {animals.length > 0 ? (
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-300 focus:border-indigo-600 outline-none bg-slate-50 text-farm-navy"
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      🐾 {a.species} ({a.batchSize} head) - {a.breed}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                  No livestock batches registered yet. Task will apply to general herd/flock health.
                </div>
              )}
            </div>
          )}

          {/* 3. Quick Action Presets */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-farm-cyan" />
              <span>Tap a Quick Preset or Type Below:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(taskCategory === 'crop'
                ? cropPresets
                : taskCategory === 'animal'
                ? animalPresets
                : generalPresets
              ).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                    title === preset.title
                      ? 'bg-farm-navy text-white border-farm-navy shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Task Title & Voice Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Task Action / Medication / Operation *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  taskCategory === 'crop'
                    ? 'e.g. Spray Ampligo for Fall armyworm'
                    : taskCategory === 'animal'
                    ? 'e.g. Newcastle Lasota 2nd booster vaccine'
                    : 'e.g. Clean knapsack sprayer nozzle'
                }
                className="flex-1 min-h-[48px] px-3.5 py-2 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-navy outline-none bg-slate-50 text-slate-900"
              />
              <VoiceInputButton
                onTranscript={(text) => setTitle(text)}
                className="shrink-0"
              />
            </div>
          </div>

          {/* 5. Due Date & Quick Date Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Due Date *
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(3)}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-[11px] font-bold text-emerald-900 cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(7)}
                  className="px-2 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200 text-[11px] font-bold text-indigo-900 cursor-pointer"
                >
                  +1 Week
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-navy outline-none bg-slate-50 text-slate-900"
            />
          </div>

          {/* 6. Priority & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full min-h-[48px] px-3 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-300 focus:border-farm-navy outline-none bg-slate-50 text-slate-900"
              >
                <option value="high">🔴 High (Urgent / Health Alert)</option>
                <option value="medium">🟡 Medium (Scheduled Routine)</option>
                <option value="low">🟢 Low (Flexible Timing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Estimated Cost ({farm.name ? 'USD' : '$'})
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[48px] px-3.5 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-300 focus:border-farm-navy outline-none bg-slate-50 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Specific Instructions / Dosage Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mix 10ml in 16L knapsack sprayer, wear protective gear"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-xl border-2 border-slate-300 focus:border-farm-navy outline-none bg-slate-50 text-slate-900"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              id="save-task-submit-btn"
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-farm-navy hover:bg-slate-800 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5 text-farm-cyan" />
              <span>Save & Schedule Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
