/**
 * Compress images client-side before storing in IndexedDB
 * Resizes max dimension to 800px and saves as JPEG with ~0.72 quality
 */
export async function compressImage(file: File | Blob, maxDimension = 800, quality = 0.72): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original blob if canvas context fails
          resolve(file instanceof Blob ? file : new Blob([file]));
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file instanceof Blob ? file : new Blob([file]));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Blob to a base64 string (used when sending to server-side Gemini API)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // remove data:image/...;base64, prefix
      const commaIndex = base64String.indexOf(',');
      if (commaIndex !== -1) {
        resolve(base64String.substring(commaIndex + 1));
      } else {
        resolve(base64String);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates an object URL for a Blob
 */
export function createBlobUrl(blob?: Blob | null): string | undefined {
  if (!blob) return undefined;
  try {
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to create blob url', err);
    return undefined;
  }
}
