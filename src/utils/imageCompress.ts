export async function compressImageFile(
  file: File,
  maxDimension = 900,
  preserveTransparency = false,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid PNG, JPG, SVG, or WebP image file.');
  }

  // Allow small SVG logos directly if under 250KB
  if (file.type === 'image/svg+xml') {
    if (file.size > 250_000) {
      throw new Error('SVG logo must be under 250 KB.');
    }
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Failed to read SVG file.'));
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
    });
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Failed to read image file.'));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid image file.'));
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process image in browser.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  if (preserveTransparency && file.type === 'image/png') {
    const pngOut = canvas.toDataURL('image/png');
    if (pngOut.length <= 360_000) {
      return pngOut;
    }
  }

  // Compress cleanly as JPEG so Firestore string length stays comfortably below 350KB
  let quality = 0.84;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (result.length > 360_000 && quality > 0.45) {
    quality -= 0.1;
    result = canvas.toDataURL('image/jpeg', quality);
  }
  if (result.length > 420_000) {
    throw new Error(
      'Image is still too large after compression. Please use a smaller file.',
    );
  }
  return result;
}
