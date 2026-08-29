import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { useTranslation } from 'react-i18next';

interface PhotoCaptureProps {
  photoBlob?: Blob | null;
  onPhotoSelected: (blob: Blob | null) => void;
  label?: string;
  className?: string;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photoBlob,
  onPhotoSelected,
  label,
  className = '',
}) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (photoBlob) {
      const url = URL.createObjectURL(photoBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [photoBlob]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file, 800, 0.72);
      onPhotoSelected(compressed);
    } catch (err) {
      console.error('Error compressing image:', err);
      // Fallback
      onPhotoSelected(file);
    } finally {
      setIsCompressing(false);
      // Reset input value so same photo can be re-chosen if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoSelected(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="farmpro-camera-input"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-farm-cyan/40 bg-slate-100 shadow-sm">
          <img
            src={previewUrl}
            alt="Captured photo"
            className="w-full h-48 sm:h-56 object-cover"
          />
          <button
            type="button"
            id="remove-photo-btn"
            onClick={clearPhoto}
            className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-md min-h-[44px] min-w-[44px]"
            title="Remove photo"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          id="capture-photo-btn"
          disabled={isCompressing}
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[52px] py-3.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-farm-navy font-bold text-base rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          {isCompressing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-farm-cyan" />
              <span>Optimizing photo...</span>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6 text-farm-cyan stroke-[2.2]" />
              <span>{label || t('common.take_photo')}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
