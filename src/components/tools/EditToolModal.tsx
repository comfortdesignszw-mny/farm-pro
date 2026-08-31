import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle2, DollarSign, Tag, Calendar, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Tool, ToolCategory, ToolCondition, Farm } from '../../types';
import { PhotoCapture } from '../common/PhotoCapture';
import { VoiceInputButton } from '../common/VoiceInputButton';

interface EditToolModalProps {
  isOpen: boolean;
  farm: Farm;
  tool: Tool | null;
  onClose: () => void;
  onSaved: (updatedTool: Tool) => void;
}

export const EditToolModal: React.FC<EditToolModalProps> = ({
  isOpen,
  farm,
  tool,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ToolCategory>('hand_tool');
  const [condition, setCondition] = useState<ToolCondition>('good');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState<string>('0');
  const [serialNumber, setSerialNumber] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setCategory(tool.category);
      setCondition(tool.condition);
      setPurchaseDate(tool.purchaseDate || new Date().toISOString().split('T')[0]);
      setCost(tool.cost !== undefined ? String(tool.cost) : '0');
      setSerialNumber(tool.serialNumber || '');
      setPhoto(tool.photo || null);
      setNotes(tool.notes || '');
    }
  }, [tool]);

  if (!isOpen || !tool) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Tool = {
      ...tool,
      name: name.trim() || 'Farm Tool',
      category,
      condition,
      purchaseDate,
      cost: parseFloat(cost) || 0,
      serialNumber: serialNumber.trim() || undefined,
      photo: photo || undefined,
      notes: notes.trim(),
    };

    await db.tools.put(updated);
    onSaved(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-farm-cyan/20 text-farm-navy flex items-center justify-center">
              <Wrench className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-farm-navy">
                Edit Equipment / Tool
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Update status, condition, and valuation
              </p>
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
          {/* Tool Name */}
          <div>
            <label className="block text-base font-bold text-farm-navy mb-1.5">
              Tool / Equipment Name
            </label>
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
                Category
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
                Condition
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
                Purchase / Acquisition Date
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
                Estimated / Purchase Cost ($)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                  className="w-full min-h-[48px] pl-10 pr-4 py-2.5 text-base font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-mono"
                />
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Serial Number / Identifier */}
          <div>
            <label className="block text-sm font-bold text-farm-navy mb-1.5">
              Serial Number / Tag ID (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-9821 / Engine #440"
                className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm font-medium rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-bold text-farm-navy mb-1.5">
              Tool Photo
            </label>
            <PhotoCapture
              photo={photo}
              onPhotoChange={setPhoto}
              label="Capture or Upload Tool Photo"
            />
          </div>

          {/* Notes with Voice Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-bold text-farm-navy">
                Maintenance Notes / Remarks
              </label>
              <VoiceInputButton
                onTranscript={(text) => setNotes((prev) => (prev ? `${prev} ${text}` : text))}
                language="en"
              />
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs new washer seal, sharp blade, serviced on 12 May"
              className="w-full p-3 rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none text-sm font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] py-2.5 px-4 bg-farm-navy hover:bg-farm-navy-light text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
