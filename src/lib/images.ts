export const MAX_BYTES = 15 * 1024 * 1024;
export const PAGE_SIZE = 36;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};

export function validateFile(file: { name: string; size: number; type: string }) {
  if (!IMAGE_TYPES[file.type]) throw new Error(`${file.name}: choose a JPG, PNG, WebP, or GIF image.`);
  if (!file.size || file.size > MAX_BYTES) throw new Error(`${file.name}: files must be between 1 byte and 15 MB.`);
}

export function parseTags(value: string) {
  const tags = [...new Set(value.split(",").map(tag => tag.trim().toLowerCase()).filter(Boolean))];
  if (tags.length > 20 || tags.some(tag => tag.length > 40)) throw new Error("Use up to 20 tags, with 40 characters or fewer per tag.");
  return tags;
}

export function validateMetadata(title: string, collection: string) {
  if (!title.trim() || title.trim().length > 160) throw new Error("Add a title of 1 to 160 characters.");
  if (collection.trim().length > 80) throw new Error("Collection names can have up to 80 characters.");
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function imageDimensions(file: File): Promise<{width: number; height: number}> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth && image.naturalHeight
        ? resolve({ width: image.naturalWidth, height: image.naturalHeight })
        : reject(new Error(`${file.name}: image dimensions could not be read.`));
      image.onerror = () => reject(new Error(`${file.name}: this file could not be decoded as an image.`));
      image.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}
