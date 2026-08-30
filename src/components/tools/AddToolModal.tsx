import React, { useState } from 'react';
import { X, Wrench, CheckCircle2, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Tool, ToolCategory, ToolCondition, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface AddToolModalProps {
  isOpen: boolean;
  farm: Farm;
  onClose: () => void;
  onSaved: (tool: Tool) => void;
}

export const AddToolModal: React.FC<AddToolModalProps> = ({
  isOpen,
  farm,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ToolCategory>('hand_tool');
  const [condition, setCondition] = useState<ToolCondition>('good');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState<number>(0);
  const [serialNumber, setSerialNumber] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTool: Tool = {
      id: 'tool_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      farmId: farm.id,
      name: name.trim() || 'Farm Tool',
      category,
      condition,
      purchaseDate,
      cost: Number(cost) || 0,
      serialNumber: serialNumber.trim() || undefined,
      photo: photo || undefined,
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    await db.tools.put(newTool);
    onSaved(newTool);
  };

  const quickToolNames = ['Hoe / Ikhuba', 'Shovel / Spade', 'Knapsack Sprayer', 'Water Pump', 'Plough / Gejo', 'Wheelbarrow'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center">
              <Wrench className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-farm-navy">
              {t('tools.add_tool_btn')}
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
          {/* Quick tool suggestions */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              1. {t('tools.tool_name')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickToolNames.map((toolName) => (
                <button
                  key={toolName}
                  type="button"
                  onClick={() => setName(toolName)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    name === toolName
                      ? 'bg-farm-navy text-farm-cyan'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {toolName}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 16L Knapsack Sprayer"
              className="w-full min-h-[48px] px-4 py-2.5 text-lg rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                2. {t('tools.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                <option value="hand_tool">{t('tools.hand_tool')}</option>
                <option value="irrigation">{t('tools.irrigation')}</option>
                <option value="machinery">{t('tools.machinery')}</option>
                <option value="storage">{t('tools.storage')}</option>
                <option value="livestock">{t('tools.livestock')}</option>
                <option value="other">{t('tools.other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                3. {t('tools.condition')}
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ToolCondition)}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                <option value="excellent">{t('tools.excellent')}</option>
                <option value="good">{t('tools.good')}</option>
                <option value="fair">{t('tools.fair')}</option>
                <option value="needs_repair">{t('tools.needs_repair')}</option>
              </select>
            </div>
          </div>

          {/* Purchase Date & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                {t('tools.purchase_date')}
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-base font-bold text-farm-navy mb-1.5">
                Cost ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full min-h-[48px] pl-10 pr-3 py-2.5 text-lg font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
                />
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Serial Number / ID */}
          <div>
            <label className="block text-sm font-bold text-farm-navy mb-1.5">
              Serial Number / Asset Tag (Optional)
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. SN-8829 / Tag #12"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm font-medium rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Tool Photo {t('common.optional')}
            </label>
            <PhotoCapture photoBlob={photo} onPhotoSelected={setPhoto} label="Add Photo of Equipment" />
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
              placeholder="e.g. Stored in shed, extra nozzle attached"
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="save-tool-btn"
              className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-6 h-6 text-farm-cyan" />
              <span>{t('common.save')} Tool</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
