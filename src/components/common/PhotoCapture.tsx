import React, { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, X, Loader2, RefreshCw } from 'lucide-react';
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      const compressed = await compressImage(file, 900, 0.75);
      onPhotoSelected(compressed);
    } catch (err) {
      console.error('Error compressing image:', err);
      // Fallback
      onPhotoSelected(file);
    } finally {
      setIsCompressing(false);
      // Reset inputs so same file can be selected again
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const clearPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoSelected(null);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden input for Camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="farmpro-camera-input"
        onChange={handleFileChange}
      />

      {/* Hidden input for Device / Gallery upload */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        id="farmpro-gallery-input"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-farm-cyan/40 bg-slate-900/5 shadow-sm space-y-2">
          <img
            src={previewUrl}
            alt="Captured photo"
            className="w-full h-44 sm:h-52 object-cover rounded-xl"
          />

          {/* Action overlay buttons */}
          <div className="p-2 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Retake photo using camera"
              >
                <Camera className="w-3.5 h-3.5 text-farm-navy" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressing}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Upload another photo from device"
              >
                <Upload className="w-3.5 h-3.5 text-farm-navy" />
                <span>Change Image</span>
              </button>
            </div>

            <button
              type="button"
              id="remove-photo-btn"
              onClick={clearPhoto}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {label && (
            <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              {label}
            </span>
          )}

          {isCompressing ? (
            <div className="w-full min-h-[52px] py-3.5 px-4 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center gap-3 text-farm-navy font-bold text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-farm-cyan" />
              <span>Optimizing photo...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Take Photo (Camera) */}
              <button
                type="button"
                id="capture-photo-camera-btn"
                onClick={() => cameraInputRef.current?.click()}
                className="min-h-[50px] py-2.5 px-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-farm-navy font-bold text-xs sm:text-sm rounded-xl border-2 border-dashed border-slate-300 hover:border-farm-cyan flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Camera className="w-5 h-5 text-emerald-600 stroke-[2.3] shrink-0" />
                <span className="text-center">{t('common.take_photo') || 'Take Photo'}</span>
              </button>

              {/* Option 2: Upload from Device / Gallery */}
              <button
                type="button"
                id="upload-photo-device-btn"
                onClick={() => galleryInputRef.current?.click()}
                className="min-h-[50px] py-2.5 px-3 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-farm-navy font-bold text-xs sm:text-sm rounded-xl border-2 border-dashed border-slate-300 hover:border-farm-cyan flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Upload className="w-5 h-5 text-cyan-600 stroke-[2.3] shrink-0" />
                <span className="text-center">Upload from Device</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
