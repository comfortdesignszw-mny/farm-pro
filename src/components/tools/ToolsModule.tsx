import React, { useState, useEffect } from 'react';
import { Wrench, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Tool, Farm } from '../../types';
import { AddToolModal } from './AddToolModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ToolsModuleProps {
  farm: Farm;
}

export const ToolsModule: React.FC<ToolsModuleProps> = ({ farm }) => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const loadTools = async () => {
    const list = await db.tools.toArray();
    setTools(list.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadTools();
  }, []);

  const handleDeleteTool = async (id: string, name: string) => {
    if (confirm(`Remove "${name}" from equipment inventory?`)) {
      await db.tools.delete(id);
      loadTools();
    }
  };

  const getConditionBadge = (c: string) => {
    switch (c) {
      case 'excellent':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">Brand New</span>;
      case 'good':
        return <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 text-xs font-black">Working Well</span>;
      case 'fair':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-black">Fair</span>;
      case 'needs_repair':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-black">Needs Repair</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-farm-navy">
            {t('tools.title')}
          </h3>
          <p className="text-sm font-semibold text-slate-600">
            {tools.length} farm implements & tools registered
          </p>
        </div>

        <button
          type="button"
          id="add-tool-header-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="min-h-[48px] px-4 py-2 rounded-xl bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4 text-farm-cyan" />
          <span>{t('tools.add_tool_btn')}</span>
        </button>
      </div>

      {tools.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 mx-auto flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-slate-600">
            No tools logged yet. Keep inventory of hoes, sprayers, pumps, and machinery.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[48px] px-5 py-2.5 rounded-xl bg-farm-cyan text-farm-navy font-bold text-base cursor-pointer"
          >
            + {t('tools.add_tool_btn')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-farm-navy flex items-center justify-center font-bold text-xl shrink-0">
                  🔧
                </div>
                <div>
                  <h4 className="text-base font-black text-farm-navy leading-tight">
                    {tool.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {getConditionBadge(tool.condition)}
                    <span className="text-xs text-slate-400 font-semibold">{tool.category}</span>
                  </div>
                  {tool.notes && (
                    <p className="text-xs text-slate-500 italic mt-1">"{tool.notes}"</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {tool.cost > 0 && (
                  <span className="text-sm font-black text-farm-navy">${tool.cost}</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteTool(tool.id, tool.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddToolModal
        isOpen={isAddModalOpen}
        farm={farm}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={(tool) => {
          setIsAddModalOpen(false);
          loadTools();
          setConfirmMsg(`Tool "${tool.name}" added!`);
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
