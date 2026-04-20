import { LetterData } from '../types';

export function encodeLetterData(data: LetterData): string {
  try {
    const json = JSON.stringify(data);
    // Use Unicode-safe base64 encoding
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    console.error('Failed to encode letter data', e);
    return '';
  }
}

export function decodeLetterData(encoded: string): LetterData | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode letter data', e);
    return null;
  }
}

export function getShareUrl(data: LetterData): string {
  const encoded = encodeLetterData(data);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('data', encoded);
  return url.toString();
}
