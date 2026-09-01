import React, { useState } from 'react';
import { AlertTriangle, Trash2, Download, X, ShieldAlert, CheckCircle2, Loader2, HardDrive } from 'lucide-react';
import { exportDatabaseBackup } from '../../db';

interface ResetFarmDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void> | void;
  farmName: string;
}

export const ResetFarmDataModal: React.FC<ResetFarmDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  farmName,
}) => {
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasExportedBackup, setHasExportedBackup] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const jsonBackup = await exportDatabaseBackup();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `FarmPro_Emergency_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setHasExportedBackup(true);
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('Failed to export backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFinalReset = async () => {
    if (!isConfirmedCheckbox) return;
    try {
      setIsResetting(true);
      await onConfirmReset();
    } catch (err) {
      console.error('Reset error:', err);
      setIsResetting(false);
    }
  };

  return (
    <div
      id="reset-farm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        id="reset-farm-modal-dialog"
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-rose-200 text-slate-900 space-y-5 my-8"
      >
        {/* Header with Danger Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-rose-100 border-2 border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 stroke-[2.4] animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                Irreversible Action
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Permanently Reset Farm?
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="close-reset-modal-btn"
            onClick={onClose}
            disabled={isResetting}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Notice Box */}
        <div className="p-4 bg-rose-50/90 rounded-2xl border border-rose-200 text-rose-950 space-y-2.5 text-sm">
          <div className="flex items-center gap-2 font-black text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Warning: All farm data and information will be lost</span>
          </div>
          <p className="text-xs sm:text-sm text-rose-800 leading-relaxed font-medium">
            Resetting will permanently wipe <strong>"{farmName || 'Your Farm'}"</strong> from this device. You will loose:
          </p>
          <ul className="text-xs text-rose-900 space-y-1.5 list-disc list-inside font-semibold pl-1">
            <li>All crop cycles, planting dates, inputs & harvest yields</li>
            <li>All livestock/poultry batches, weights & vaccination logs</li>
            <li>All financial records, equipment inventory & farm tasks</li>
            <li>All custom officer contacts and offline advisory history</li>
          </ul>
        </div>

        {/* Recommended Safety Step: Export Backup */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <HardDrive className="w-4 h-4 text-cyan-600" />
              <span>Recommended Precaution</span>
            </div>
            {hasExportedBackup && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Backup Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Download a backup file to your phone or computer first so you can restore your data later if needed.
          </p>
          <button
            type="button"
            id="modal-export-backup-btn"
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
            ) : (
              <Download className="w-4 h-4 text-cyan-600" />
            )}
            <span>{hasExportedBackup ? 'Download Backup File Again' : 'Download Backup File (.json) First'}</span>
          </button>
        </div>

        {/* Mandatory Double Confirmation Checkbox */}
        <label
          htmlFor="confirm-reset-checkbox"
          className="flex items-start gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer select-none"
        >
          <input
            type="checkbox"
            id="confirm-reset-checkbox"
            checked={isConfirmedCheckbox}
            onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
            disabled={isResetting}
            className="w-5 h-5 mt-0.5 rounded border-amber-400 text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-amber-950 leading-snug">
            I understand that this action is irreversible and will permanently delete all my farm records and files.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            id="cancel-reset-modal-btn"
            onClick={onClose}
            disabled={isResetting}
            className="w-full min-h-[48px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl cursor-pointer transition-all"
          >
            Cancel (Keep My Data)
          </button>

          <button
            type="button"
            id="confirm-reset-modal-btn"
            onClick={handleFinalReset}
            disabled={!isConfirmedCheckbox || isResetting}
            className={`w-full min-h-[48px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isConfirmedCheckbox && !isResetting
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer'
                : 'bg-rose-200 text-rose-400 cursor-not-allowed'
            }`}
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Deleting Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Permanently Reset</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
