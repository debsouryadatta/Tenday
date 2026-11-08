import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { Id } from './backend';
import { CONVEX_SITE_URL } from '../constants';

export async function uploadFile(
  uri: string,
  name: string,
  mime: string,
  kind: 'meal' | 'report',
  token: string | null,
) {
  if (!token) throw new Error('Session not ready');
  const file =
    Platform.OS === 'web' ? await (await fetch(uri)).blob() : new File(uri);
  if (file.size > 6 * 1024 * 1024)
    throw new Error('Choose a file smaller than 6 MB.');
  const response = await expoFetch(`${CONVEX_SITE_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': mime,
      'X-File-Name': name.replace(/[^\w. -]/g, '').slice(0, 120),
      'X-File-Kind': kind,
    },
    body: file,
  });
  if (!response.ok) throw new Error(await response.text());
  const data = (await response.json()) as { fileId: Id<'files'> };
  return data.fileId;
}
export async function mealPhoto(camera: boolean) {
  if (camera && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        'Camera access is off. Choose a photo or describe your meal instead.',
      );
  }
  const result = camera
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
  if (result.canceled) return null;
  const photo = result.assets[0];
  return preparePhoto(photo);
}
export async function preparePhoto(photo: ImagePicker.ImagePickerAsset) {
  const context = ImageManipulator.manipulate(photo.uri);
  if (photo.width > 1600) context.resize({ width: 1600 });
  const rendered = await context.renderAsync();
  return rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
}
export async function openSource(
  fileId: Id<'files'>,
  name: string,
  token: string | null,
) {
  if (!token) throw new Error('Reconnect to open the source.');
  const url = `${CONVEX_SITE_URL}/files/${fileId}`;
  if (Platform.OS === 'web') {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok)
      throw new Error('The source could not open. Reconnect and try again.');
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } else {
    const file = await File.downloadFileAsync(
      url,
      new File(Paths.cache, name.replace(/[^\w. -]/g, '') || 'report.pdf'),
      { headers: { Authorization: `Bearer ${token}` }, idempotent: true },
    );
    if (await File.canPreview(file))
      await File.preview(file, { title: 'Your report source' });
    else if (await Sharing.isAvailableAsync())
      await Sharing.shareAsync(file.uri, { dialogTitle: 'Your report source' });
    else throw new Error('No document viewer is available on this device.');
  }
}
