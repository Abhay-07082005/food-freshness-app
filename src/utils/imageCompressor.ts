/**
 * Client-side utility to resize and compress raw image files or base64 strings
 * using browser canvas APIs. Reduces file size to ensure fast transmission
 * over API endpoints.
 */
export function compressImage(
  fileOrBase64: File | string,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.85
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      // Draw to temporary canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context."));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as compressed JPEG
      const mimeType = "image/jpeg";
      const base64 = canvas.toDataURL(mimeType, quality);
      resolve({ base64, mimeType });
    };
    
    img.onerror = (err) => {
      reject(new Error("Failed to load image for compression."));
    };
    
    if (typeof fileOrBase64 === "string") {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("FileReader yielded empty result."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
