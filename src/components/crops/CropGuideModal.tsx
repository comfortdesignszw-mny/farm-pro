import React from 'react';
import { X, Sprout, PlusCircle, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CropCategory } from '../../types';
import { SEED_ADVISORY_DATA } from '../../db/seedAdvisory';

interface CropGuideModalProps {
  crop: CropCategory | string | null;
  isOpen: boolean;
  onClose: () => void;
  onPlantCrop: (crop: string) => void;
}

export const CropGuideModal: React.FC<CropGuideModalProps> = ({
  crop,
  isOpen,
  onClose,
  onPlantCrop,
}) => {
  const { t, i18n } = useTranslation();

  if (!isOpen || !crop) return null;

  // Find matching guide from seed in current language, or fallback to English, or general crop guide
  const guide =
    SEED_ADVISORY_DATA.find((g) => g.topic === crop && g.language === i18n.language) ||
    SEED_ADVISORY_DATA.find((g) => g.topic === crop && g.language === 'en') ||
    SEED_ADVISORY_DATA.find((g) => g.category === 'crop' && g.language === 'en') ||
    SEED_ADVISORY_DATA[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 my-auto">
        {/* Leading photo */}
        <div className="relative h-52 sm:h-60 w-full bg-slate-800">
          <img
            src={guide.imageUrl}
            alt={crop}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-farm-navy via-farm-navy/40 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-md"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-400 text-emerald-950 font-black text-xs uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('crops.guide_banner', 'Crop Production Guide')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {crop}
            </h2>
          </div>
        </div>

        {/* Content Body: Short bullet points */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-base font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {guide.summary}
          </p>

          <div className="space-y-2.5">
            {guide.bulletPoints.map((bullet, idx) => {
              const parts = bullet.split(':');
              const heading = parts.length > 1 ? parts[0] : '';
              const rest = parts.length > 1 ? parts.slice(1).join(':') : bullet;

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div className="text-base text-slate-800 leading-relaxed font-medium">
                    {heading && <strong className="text-farm-navy font-bold">{heading}: </strong>}
                    {rest}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Primary Action Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              id="plant-crop-cta-btn"
              onClick={() => {
                onClose();
                onPlantCrop(crop === 'Other' ? '' : crop);
              }}
              className="w-full min-h-[56px] py-4 px-6 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-emerald-950 font-black text-xl rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer"
            >
              <Sprout className="w-6 h-6 stroke-[2.5]" />
              <span>{t('crops.plant_this_crop', 'Plant This Crop')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
