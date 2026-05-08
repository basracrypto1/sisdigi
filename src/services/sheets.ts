import { storage } from '../lib/localDb';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNBTczA5A6a7AdhHpQfxFT-dqUFdmGIBdWMMgD-0RjfNVXTJuJguPRJTZZmX_Po1wK/exec';

export async function callAppsScript(action: 'append' | 'update' | 'get', sheetName: string, range: string, values?: any[][]) {
  const settings = storage.getSettings();
  // Favor hardcoded URL but allow settings override if needed in the future
  const url = settings?.defaults?.googleAppScriptUrl || APPS_SCRIPT_URL;

  if (!url) {
    throw new Error('Google Apps Script URL belum dikonfigurasi.');
  }

  const response = await fetch(url + (url.includes('?') ? '&' : '?') + `action=${action}&sheet=${sheetName}&range=${range}`, {
    method: 'POST',
    body: JSON.stringify(values || []),
  });

  if (!response.ok) {
    throw new Error('Gagal menghubungi Google Apps Script.');
  }

  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result;
}

export async function syncCitizensToSheet(citizens: any[]) {
  const headers = [['ID', 'NIK', 'Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Pekerjaan', 'Alamat', 'Terakhir Diperbarui']];
  const rows = citizens.map(c => [
    c.id,
    c.nik,
    c.nama,
    c.tempatLahir,
    c.tanggalLahir,
    c.jenisKelamin,
    c.pekerjaan,
    c.alamat,
    c.updatedAt
  ]);
  return callAppsScript('update', 'Warga', 'A1', [...headers, ...rows]);
}

export async function syncLetterToSheet(letter: any) {
  const row = [
    letter.id,
    letter.nomorSurat,
    letter.type,
    letter.tanggalSurat,
    letter.nama,
    letter.nik,
    letter.keperluan,
    new Date().toLocaleString('id-ID')
  ];
  return callAppsScript('append', 'Arsip', 'A2', [row]);
}

export async function syncRabToSheet(rab: any) {
  const rows = rab.items.map((item: any) => [
    rab.judul,
    rab.jenis,
    item.nama_item,
    item.qty,
    item.satuan,
    item.harga_satuan,
    item.subtotal,
    new Date().toLocaleString('id-ID')
  ]);
  return callAppsScript('append', 'RAB', 'A2', rows);
}
