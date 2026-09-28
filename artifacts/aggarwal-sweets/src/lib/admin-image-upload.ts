export const MAX_IMAGE_FILE_KB = 200;
export const MAX_IMAGE_FILE_BYTES = MAX_IMAGE_FILE_KB * 1024;
const MAX_IMAGE_REQUEST_BYTES = 9 * 1024 * 1024;

export const IMAGE_UPLOAD_HINT = `Image file up to ${MAX_IMAGE_FILE_KB} KB.`;

export function readAdminImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choose an image file."));
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    return Promise.reject(new Error(`Image is too large. Choose an image up to ${MAX_IMAGE_FILE_KB} KB.`));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image. Choose another file."));
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.startsWith("data:image/")) {
        reject(new Error("Could not read this image. Choose another file."));
      } else {
        resolve(reader.result);
      }
    };
    reader.readAsDataURL(file);
  });
}

export function checkImageSaveSize(body: string): void {
  if (new Blob([body]).size > MAX_IMAGE_REQUEST_BYTES) {
    throw new Error("Images in this save are too large together. Use smaller images and try again (9 MB total).");
  }
}

export async function requireImageSave(response: Response, action: string): Promise<void> {
  if (response.ok) return;
  if (response.status === 413) {
    throw new Error("The image or combined images are too large for the server. Use smaller images and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("Your admin session expired. Sign in again and retry.");
  }
  const body = await response.json().catch(() => ({}));
  throw new Error(typeof body.error === "string" ? body.error : `${action} failed (HTTP ${response.status}). Please try again.`);
}