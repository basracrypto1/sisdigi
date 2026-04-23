/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedLetter, Citizen } from '../types';

const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxMzobb148YNJdFJN40oRW5R0xKZOBFr0jIHvg_tCf7q2eyBnLvnOJSBFxRLKt_OjcA/exec'
};

/**
 * Service to handle Google Sheets interaction via Google Apps Script Web App.
 * This removes the need for Firebase or client-side OAuth.
 */
export const googleSheetsService = {
  /**
   * Send data to Google Apps Script Web App
   */
  async sendToScript(url: string | undefined | null, payload: any) {
    const targetUrl = url || CONFIG.SCRIPT_URL;
    
    if (!targetUrl) {
      console.warn("URL App Script belum dikonfigurasi.");
      return false;
    }
    
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });
      
      console.log("Data sent to Google Sheets successfully (background).");
      return true; 
    } catch (error) {
      console.error("Error sending to Apps Script:", error);
      return false;
    }
  },

  /**
   * Save a letter to the sheet
   */
  async saveLetterToSheet(scriptUrl: string | undefined | null, letter: SavedLetter) {
    return this.sendToScript(scriptUrl || CONFIG.SCRIPT_URL, {
      action: 'saveLetter',
      data: {
        id: letter.id,
        nomorSurat: letter.nomorSurat,
        jenisSurat: letter.type,
        tanggal: letter.tanggalSurat,
        nama: letter.nama,
        nik: letter.nik,
        keperluan: letter.keperluan,
        timestamp: new Date().toISOString()
      }
    });
  },

  /**
   * Sync all citizens to the sheet
   */
  async syncCitizens(scriptUrl: string | undefined | null, citizens: Citizen[]) {
    return this.sendToScript(scriptUrl || CONFIG.SCRIPT_URL, {
      action: 'syncCitizens',
      data: citizens.map(c => ({
        nik: c.nik,
        nama: c.nama,
        tempatLahir: c.tempatLahir,
        tanggalLahir: c.tanggalLahir,
        jenisKelamin: c.jenisKelamin,
        pekerjaan: c.pekerjaan,
        alamat: c.alamat
      }))
    });
  }
};
