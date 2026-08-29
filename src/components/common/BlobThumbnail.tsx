import React, { useState, useEffect } from 'react';

interface BlobThumbnailProps {
  blob?: Blob | null;
  fallbackEmoji: string;
  fallbackBgClass?: string;
  alt?: string;
  className?: string;
}

export const BlobThumbnail: React.FC<BlobThumbnailProps> = ({
  blob,
  fallbackEmoji,
  fallbackBgClass = 'bg-emerald-100 text-emerald-800',
  alt = 'Image',
  className = 'w-14 h-14 rounded-2xl',
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setImageUrl(null);
      return;
    }

    try {
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.warn('Failed to create Object URL for Blob', e);
      setImageUrl(null);
    }
  }, [blob]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} object-cover border border-slate-200 shrink-0 shadow-xs`}
      />
    );
  }

  return (
    <div
      className={`${className} ${fallbackBgClass} flex items-center justify-center font-black text-2xl shrink-0 shadow-xs border border-slate-200/50`}
    >
      <span>{fallbackEmoji}</span>
    </div>
  );
};
