import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onClose: () => void;
  actionText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  actionText,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      // Trigger a light haptic & celebratory burst
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00B4D8', '#0A2540', '#FBBF24', '#10B981'],
        });
      } catch (e) {
        // Safe ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="confirmation-modal-content"
        className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-500 text-center flex flex-col items-center animate-in zoom-in-95 duration-200"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-5 shadow-inner">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <h2 className="text-2xl font-bold text-farm-navy mb-2 tracking-tight">
          {title}
        </h2>

        {message && (
          <p className="text-lg text-slate-600 mb-6 max-w-xs leading-relaxed">
            {message}
          </p>
        )}

        <button
          id="confirm-modal-ok-btn"
          type="button"
          onClick={onClose}
          className="w-full min-h-[56px] py-4 px-6 bg-farm-navy hover:bg-farm-navy-light active:scale-[0.98] text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-md cursor-pointer"
        >
          <span>{actionText || t('common.next')}</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
