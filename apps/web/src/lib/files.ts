import { CONVEX_SITE_URL } from '../constants';
import type { Id } from './backend';
export async function photoFile(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPEG, PNG or WebP meal photo.');
  if (file.size > 20 * 1024 * 1024)
    throw new Error('Choose a photo smaller than 20 MB.');
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error(
      'This browser could not prepare the photo. Try text instead.',
    );
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error('The photo could not be prepared.')),
      'image/jpeg',
      0.82,
    ),
  );
  return new File([blob], 'meal.jpg', { type: 'image/jpeg' });
}
export async function uploadFile(
  file: File,
  kind: 'meal' | 'report',
  token: string | null,
) {
  if (!token)
    throw new Error('Your private session is reconnecting. Try again shortly.');
  if (file.size > 6 * 1024 * 1024)
    throw new Error('Choose a source smaller than 6 MB.');
  const response = await fetch(`${CONVEX_SITE_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
      'X-File-Kind': kind,
      'X-File-Name': file.name.replace(/[^\w. -]/g, '').slice(0, 120),
    },
    body: file,
  });
  if (!response.ok) throw new Error(await response.text());
  return ((await response.json()) as { fileId: Id<'files'> }).fileId;
}
export async function openSource(
  id: Id<'files'>,
  name: string,
  token: string | null,
) {
  if (!token) throw new Error('Reconnect to open your source.');
  const response = await fetch(`${CONVEX_SITE_URL}/files/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error('The source could not open. Reconnect and try again.');
  const url = URL.createObjectURL(await response.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
