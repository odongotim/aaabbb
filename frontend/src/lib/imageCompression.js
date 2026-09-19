/**
 * imageCompression.js
 * Shrinks a photo in the browser before it's uploaded — runs once, on
 * the admin's device, at the moment they pick a file. Voters never run
 * this; they only ever download the already-small result.
 */

// Loads a File into something drawable on a canvas. Prefers
// createImageBitmap (fast, off the main thread internally) and falls
// back to an <img> element for formats/browsers that don't support it.
async function loadDrawable(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Resizes so the longer edge is at most maxDimension, then re-encodes
 * as JPEG at the given quality. A typical phone photo (4-8 MB) comes
 * out around 100-300 KB, taking well under a second.
 */
export async function compressImage(file, { maxDimension = 1000, quality = 0.82 } = {}) {
  const drawable = await loadDrawable(file);
  const width = drawable.width;
  const height = drawable.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(drawable, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('Could not process this image.');
  return blob;
}
