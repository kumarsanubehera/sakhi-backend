import path from 'path';
import { uploadRoot } from '../../config/storage.js';
import { AppError } from '../../common/utils/helpers.js';
export function resolveKey(storageKey) {
  const root = path.resolve(uploadRoot);
  const full = path.resolve(root, storageKey);
  if (!full.startsWith(root)) throw new AppError('Invalid file path', 400);
  return full;
}
export async function removeFile(storageKey) {
  const { unlink } = await import('fs/promises');
  await unlink(resolveKey(storageKey)).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}