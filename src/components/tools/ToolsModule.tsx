import React, { useState, useEffect } from 'react';
import {
  Wrench,
  PlusCircle,
  Trash2,
  Edit2,
  Share2,
  CheckCircle2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Tag,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import { Tool, Farm, ToolCategory, ToolCondition } from '../../types';
import { AddToolModal } from './AddToolModal';
import { EditToolModal } from './EditToolModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { shareToolDetails } from '../../utils/shareUtils';

interface ToolsModuleProps {
  farm: Farm;
}

export const ToolsModule: React.FC<ToolsModuleProps> = ({ farm }) => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
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
      await loadTools();
      setConfirmMsg(`Tool "${name}" removed from inventory.`);
    }
  };

  const handleShareTool = async (tool: Tool) => {
    const result = await shareToolDetails(tool, farm);
    if (result.type === 'copied' || result.type === 'shared') {
      setConfirmMsg(result.message);
    }
  };

  const getConditionBadge = (c: ToolCondition) => {
    switch (c) {
      case 'excellent':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Brand New / Excellent
          </span>
        );
      case 'good':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
            Good Working Order
          </span>
        );
      case 'fair':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Fair / Usable
          </span>
        );
      case 'needs_repair':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            Needs Repair
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: ToolCategory) => {
    switch (category) {
      case 'hand_tool':
        return 'Hand Tool';
      case 'irrigation':
        return 'Irrigation';
      case 'machinery':
        return 'Machinery';
      case 'storage':
        return 'Storage';
      case 'livestock':
        return 'Livestock';
      default:
        return 'General';
    }
  };

  // Filtered tools
  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.notes && tool.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tool.serialNumber && tool.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    const matchesCondition = conditionFilter === 'all' || tool.condition === conditionFilter;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const totalValue = tools.reduce((sum, item) => sum + (item.cost || 0), 0);
  const workingCount = tools.filter((t) => t.condition === 'excellent' || t.condition === 'good').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-farm-navy">
            {t('tools.title')}
          </h3>
          <p className="text-sm font-semibold text-slate-600">
            Keep track of implements, machinery, pumps, maintenance & value
          </p>
        </div>

        <button
          type="button"
          id="add-tool-header-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="min-h-[46px] px-4 py-2.5 rounded-xl bg-farm-navy hover:bg-farm-navy-light text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
        >
          <PlusCircle className="w-5 h-5 text-farm-cyan" />
          <span>{t('tools.add_tool_btn')}</span>
        </button>
      </div>

      {/* Mini Stats Summary */}
      {tools.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500">Total Implements</div>
            <div className="text-lg sm:text-xl font-black text-farm-navy mt-0.5">{tools.length}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500">Operational</div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">
              {workingCount} / {tools.length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-500">Total Valuation</div>
            <div className="text-lg sm:text-xl font-black text-cyan-800 mt-0.5">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter bar */}
      {tools.length > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools, serials, notes..."
              className="w-full pl-9 pr-3 py-2 text-sm font-medium rounded-lg border border-slate-200 focus:border-farm-cyan outline-none bg-slate-50"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="hand_tool">Hand Tools</option>
              <option value="irrigation">Irrigation</option>
              <option value="machinery">Machinery</option>
              <option value="storage">Storage</option>
              <option value="livestock">Livestock</option>
              <option value="other">Other</option>
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">All Conditions</option>
              <option value="excellent">Brand New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="needs_repair">Needs Repair</option>
            </select>
          </div>
        </div>
      )}

      {/* Tool Cards List */}
      {tools.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-300 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-700 mx-auto flex items-center justify-center">
            <Wrench className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-lg font-black text-farm-navy">No Tools Registered Yet</h4>
            <p className="text-sm font-semibold text-slate-600 mt-1 max-w-md mx-auto">
              Keep an accurate inventory of hoes, knapsack sprayers, water pumps, tractors, and livestock gear.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-farm-cyan hover:bg-farm-cyan-light text-farm-navy font-bold text-base cursor-pointer shadow-xs transition-all"
          >
            + {t('tools.add_tool_btn')}
          </button>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500 font-semibold">
          No tools match the selected filters or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Category Badge + Status Badge + Value */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      {getCategoryLabel(tool.category)}
                    </span>
                    {getConditionBadge(tool.condition)}
                  </div>
                  {tool.cost > 0 && (
                    <div className="text-sm font-black text-farm-navy bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ${tool.cost.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Main Body */}
                <div className="flex items-start gap-3">
                  {tool.photo ? (
                    <img
                      src={URL.createObjectURL(tool.photo)}
                      alt={tool.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 text-farm-navy flex items-center justify-center font-bold text-2xl shrink-0">
                      🔧
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-black text-farm-navy leading-snug truncate">
                      {tool.name}
                    </h4>

                    {tool.serialNumber && (
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>ID: {tool.serialNumber}</span>
                      </div>
                    )}

                    {tool.purchaseDate && (
                      <div className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Acquired: {tool.purchaseDate}</span>
                      </div>
                    )}

                    {tool.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 mt-2 border border-slate-100 font-medium line-clamp-2">
                        "{tool.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row: Edit, Share, Delete */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => setEditingTool(tool)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => handleShareTool(tool)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-cyan-200"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteTool(tool.id, tool.name)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddToolModal
        isOpen={isAddModalOpen}
        farm={farm}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={(tool) => {
          setIsAddModalOpen(false);
          loadTools();
          setConfirmMsg(`Tool "${tool.name}" added to inventory!`);
        }}
      />

      <EditToolModal
        isOpen={!!editingTool}
        farm={farm}
        tool={editingTool}
        onClose={() => setEditingTool(null)}
        onSaved={(updated) => {
          setEditingTool(null);
          loadTools();
          setConfirmMsg(`Tool "${updated.name}" updated successfully!`);
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
