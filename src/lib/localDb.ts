
/**
 * Local Database Utility using LocalStorage
 * Replaces Firebase for data persistence
 */

import { LetterData, SavedLetter, Citizen } from '../types';

const STORAGE_KEYS = {
  LETTERS: 'sisdigi_letters',
  CITIZENS: 'sisdigi_citizens',
  SETTINGS: 'sisdigi_settings',
  COUNTER: 'sisdigi_counter'
};

export const storage = {
  // Letters
  getLetters: (): SavedLetter[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LETTERS);
    return data ? JSON.parse(data) : [];
  },
  saveLetter: (letter: LetterData) => {
    const letters = storage.getLetters();
    const index = letters.findIndex(l => l.id === letter.id);
    const updatedLetter: SavedLetter = { 
      ...letter, 
      updatedAt: new Date().toISOString() 
    };
    
    if (index >= 0) {
      letters[index] = updatedLetter;
    } else {
      letters.unshift(updatedLetter);
    }
    
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters.slice(0, 50)));
    return updatedLetter;
  },
  deleteLetter: (id: string) => {
    const letters = storage.getLetters().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
  },

  // Citizens
  getCitizens: (): Citizen[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CITIZENS);
    return data ? JSON.parse(data) : [];
  },
  saveCitizen: (citizen: Partial<Citizen>) => {
    const citizens = storage.getCitizens();
    const id = citizen.id || crypto.randomUUID();
    const index = citizens.findIndex(c => c.id === id);
    const updatedCitizen: Citizen = {
      ...(citizen as Citizen),
      id,
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
      citizens[index] = updatedCitizen;
    } else {
      citizens.unshift(updatedCitizen);
    }

    localStorage.setItem(STORAGE_KEYS.CITIZENS, JSON.stringify(citizens));
    return updatedCitizen;
  },
  deleteCitizen: (id: string) => {
    const citizens = storage.getCitizens().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CITIZENS, JSON.stringify(citizens));
  },

  // Settings & Counter
  getSettings: () => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  },
  saveSettings: (settings: any) => {
    const current = storage.getSettings() || {};
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  },
  getCounter: (): number => {
    const count = localStorage.getItem(STORAGE_KEYS.COUNTER);
    return count ? parseInt(count, 10) : 1;
  },
  setCounter: (count: number) => {
    localStorage.setItem(STORAGE_KEYS.COUNTER, count.toString());
  },

  // Global Clean
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // AI Persistence
  saveAIState: (state: { prompt: string; suggestion: any }) => {
    localStorage.setItem('sisdigi_ai_state', JSON.stringify(state));
  },
  getAIState: () => {
    const data = localStorage.getItem('sisdigi_ai_state');
    return data ? JSON.parse(data) : { prompt: '', suggestion: null };
  }
};
