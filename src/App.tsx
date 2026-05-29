/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { LetterData, INITIAL_DATA, SavedLetter, Citizen } from './types';
import { storage } from './lib/localDb';
import { syncLetterToSheet } from './services/sheets';
import { LetterForm, LetterFormHandle, FormSection } from './components/LetterForm';
import { LetterPreview } from './components/LetterPreview';
import { Dashboard } from './components/Dashboard';
import { Sidebar, PageId } from './components/Sidebar';
import { DataWarga } from './components/DataWarga';
import { Arsip } from './components/Arsip';
import { Settings } from './components/Settings';
import { AIBannerGenerator } from './components/AIBannerGenerator';
import { BudgetGenerator } from './components/BudgetGenerator';
import { generateWordLetter } from './lib/wordGenerator';
import { generateLetterNumber } from './lib/utils';
import { Menu, Download, FileText, CheckCircle2, RefreshCw, History, Heart, X, Sparkles, Layout, Edit3, LayoutDashboard, LogIn, LogOut, User as UserIcon, Loader2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock User for Local Environment
const MOCK_USER = {
  uid: 'local-user',
  displayName: 'Pengguna',
  email: 'user@sisdigi.id',
  photoURL: null
};

export default function App() {
  const [user, setUser] = useState<any>(MOCK_USER);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [counter, setCounter] = useState(1);
  const [history, setHistory] = useState<SavedLetter[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<LetterData>(() => ({
    ...INITIAL_DATA,
    id: crypto.randomUUID(),
    nomorSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0]
  }));
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('File Word berhasil diunduh.');
  const [showGreetings, setShowGreetings] = useState(false);
  const formRef = useRef<LetterFormHandle>(null);

  useEffect(() => {
    // Initial load from LocalStorage
    const storedAuth = localStorage.getItem('sisdigi_auth_v2');
    if (storedAuth) {
      setUser(JSON.parse(storedAuth));
    }
    setAuthLoading(false);

    // Initial Data Sync
    setHistory(storage.getLetters());
    setCounter(storage.getCounter());
    const settings = storage.getSettings();
    if (settings?.defaults) {
      const defaults = { ...settings.defaults };
      const isOldData = defaults.desa === 'Cakrawana' || 
                        defaults.kabupaten === 'Cakrawana' || 
                        defaults.kecamatan === 'Wiralaksana' ||
                        defaults.namaKades === 'NAFIS BASKARA' ||
                        !defaults.desa;
                        
      if (isOldData) {
        defaults.kabupaten = 'Bangkalan';
        defaults.kecamatan = 'Tanah Merah';
        defaults.desa = 'Tanah Merah Laok';
        defaults.alamatDesa = 'Jl. Raya Desa Tanah Merah Laok, Tanah Merah';
        defaults.jabatanKades = 'Kepala Desa';
        defaults.namaKades = 'NAFIS BASKARA';
        storage.saveSettings({ defaults });
      }
      setData(prev => ({ ...prev, ...defaults }));
    }
  }, []);

  const handleLogin = async () => {
    setUser(MOCK_USER);
    localStorage.setItem('sisdigi_auth_v2', JSON.stringify(MOCK_USER));
  };

  const handleLogout = async () => {
    // Hidden logout if needed for dev
  };

  const syncToSheets = async (letter: SavedLetter) => {
    try {
      setIsSyncing(true);
      await syncLetterToSheet(letter);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const closeGreeting = () => {
    setShowGreetings(false);
    sessionStorage.setItem('hasSeenGreeting', 'true');
  };

  const updateData = (update: Partial<LetterData> | ((prev: LetterData) => LetterData)) => {
    setData(prev => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
      
      const sanitize = (val: any): any => {
        if (val === null || val === undefined || val === 'null' || val === 'undefined') return '';
        if (Array.isArray(val)) return val.map(sanitize);
        if (typeof val === 'object' && val !== null) {
          const obj: any = {};
          Object.keys(val).forEach(k => {
            obj[k] = sanitize(val[k]);
          });
          return obj;
        }
        if (typeof val === 'string') {
          return val.replace(/\*\*/g, '');
        }
        return val;
      };

      return sanitize(next);
    });
  };

  useEffect(() => {
    updateData({ nomorSurat: generateLetterNumber(counter, getLetterCode(data.type)) });
  }, [counter, data.type, data.judulSurat]);

  const saveToHistory = () => {
    if (!user) return;
    const saved = storage.saveLetter(data);
    setHistory(storage.getLetters());
    return saved;
  };

  const deleteFromHistory = (id: string) => {
    storage.deleteLetter(id);
    setHistory(storage.getLetters());
  };

  const loadFromHistory = (letter: SavedLetter) => {
    const { updatedAt, ...letterData } = letter;
    updateData(letterData);
    setCurrentPage('buat-surat');
    setActiveTab('preview');
  };

  const handleSelectCitizen = (citizen: Citizen) => {
    updateData({
      nama: citizen.nama,
      nik: citizen.nik,
      tempatLahir: citizen.tempatLahir,
      tanggalLahir: citizen.tanggalLahir,
      jenisKelamin: citizen.jenisKelamin,
      pekerjaan: citizen.pekerjaan,
      alamat: citizen.alamat
    });
    setCurrentPage('buat-surat');
    setActiveTab('edit');
    if (formRef.current) {
      formRef.current.setSection('pemohon');
    }
  };

  const incrementCounter = () => {
    const nextCounter = counter + 1;
    setCounter(nextCounter);
    storage.setCounter(nextCounter);
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await generateWordLetter(data);
      setSuccessMessage('File Word berhasil diunduh & masuk daftar Diterbitkan.');
      setShowSuccess(true);
      
      const saved = storage.saveLetter(data);
      setHistory(storage.getLetters());
      
      // Auto-sync to Sheets
      if (saved) {
        syncToSheets(saved).catch(console.error);
      }
      
      incrementCounter();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setErrorMessage('Gagal membuat file Word.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const getLetterCode = (type: string) => {
    if (type === 'admin') {
      const title = data.judulSurat.toUpperCase();
      if (title.includes('KETERANGAN')) return 'SKT';
      if (title.includes('PENGANTAR')) return 'SP';
      if (title.includes('PERMOHONAN')) return 'SR';
      return 'SK';
    }
    
    switch (type) {
      case 'business': return 'KUI';
      case 'cv': return 'CV';
      case 'job_app': return 'LMR';
      default: return 'SK';
    }
  };

  const handleRefreshNumber = () => {
    updateData({ nomorSurat: generateLetterNumber(counter, getLetterCode(data.type)) });
  };

  const handleUpdateSettings = (defaults: Partial<LetterData>) => {
    updateData(defaults);
    storage.saveSettings({ defaults });
  };

  const clearDatabase = () => {
    if (confirm('Hapus seluruh data secara permanen?')) {
      storage.clearAll();
      window.location.reload();
    }
  };

  const handleSwitchToEdit = (section?: string) => {
    setActiveTab('edit');
    if (section && formRef.current) {
      formRef.current.setSection(section as FormSection);
    }
  };

  const handleReset = () => {
    const settings = storage.getSettings();
    const defaults = settings?.defaults || {};
    
    setData(prev => ({
      ...INITIAL_DATA,
      ...defaults,
      id: crypto.randomUUID(),
      nomorSurat: prev.nomorSurat,
      tanggalSurat: new Date().toISOString().split('T')[0],
      memo: ''
    }));
    if (formRef.current) {
      formRef.current.setSection('umum');
    }
    setActiveTab('edit');
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg">
        <RefreshCw className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen max-w-[2000px] mx-auto bg-bg text-ink font-sans transition-colors duration-500 overflow-hidden shadow-2xl relative">
      <Sidebar 
        activePage={currentPage} 
        onPageChange={setCurrentPage} 
        isOpen={isSidebarOpen} 
        onOpen={() => setIsSidebarOpen(true)}
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative lg:pl-72">
        <header className="lg:hidden h-16 bg-paper border-b border-line flex items-center justify-between px-4 sm:px-6 z-50 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-ink hover:text-accent font-bold">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-display text-base sm:text-lg font-black tracking-tight uppercase leading-none">
              SIS<span className="text-accent underline decoration-accent/20">DIGI</span>
            </h1>
            <p className="text-[6px] font-black text-accent uppercase tracking-[2px] mt-0.5 leading-none">
              DESA TANAH MERAH LAOK
            </p>
            <span className="text-[5px] font-bold text-ink/30 uppercase tracking-[1px] mt-1 leading-none italic">
              SISTEM SURAT DIGITAL
            </span>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 h-full overflow-hidden relative bg-bg">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-y-auto">
                <Dashboard history={history} fullPage onClose={() => {}} onStartWriting={() => setCurrentPage('buat-surat')} />
              </motion.div>
            )}
            {currentPage === 'warga' && (
              <motion.div key="warga" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-hidden">
                <DataWarga onSelectCitizen={handleSelectCitizen} />
              </motion.div>
            )}
            {currentPage === 'arsip' && (
              <motion.div key="arsip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-hidden">
                <Arsip history={history} onSelect={loadFromHistory} onDelete={deleteFromHistory} />
              </motion.div>
            )}
            {currentPage === 'banner-generator' && (
              <motion.div key="banner-generator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-hidden">
                <AIBannerGenerator />
              </motion.div>
            )}
            {currentPage === 'budget-ai' && (
              <motion.div key="budget-ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-hidden">
                <BudgetGenerator />
              </motion.div>
            )}
            {currentPage === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-y-auto">
                <Settings currentData={data} onUpdateDefaults={handleUpdateSettings} onClearDatabase={clearDatabase} />
              </motion.div>
            )}
            {currentPage === 'buat-surat' && (
              <motion.div key="buat-surat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col lg:flex-row relative">
                <div className="lg:hidden flex border-b border-line bg-white shrink-0">
                  <button onClick={() => setActiveTab('edit')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 ${activeTab === 'edit' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-ink/40'}`}>
                    <Edit3 className="w-3.5 h-3.5" /> Data Formulir
                  </button>
                  <button onClick={() => setActiveTab('preview')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 ${activeTab === 'preview' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-ink/40'}`}>
                    <Layout className="w-3.5 h-3.5" /> Pratinjau
                  </button>
                </div>
                <aside className={`w-full lg:w-[480px] h-full flex flex-col bg-bg border-r border-line overflow-y-auto ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
                  <div className="p-4 sm:p-6 md:p-8 lg:p-10 shrink-0"><LetterForm ref={formRef} data={data} onChange={updateData} onRefreshNumber={handleRefreshNumber} onFinish={() => setActiveTab('preview')} /></div>
                  <div className="p-6 sm:p-10 pt-0 space-y-3 mt-auto border-t border-line/10 bg-bg/50">
                    <button onClick={handleReset} className="w-full py-4.5 bg-accent/5 border border-accent/20 text-accent rounded-2xl font-black text-[10px] tracking-widest hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3 uppercase shadow-sm">
                      <RefreshCw className="w-4 h-4" /> BERSIHKAN FORM
                    </button>
                  </div>
                </aside>
                <main className={`flex-1 h-full bg-preview-bg overflow-y-auto ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
                  <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 z-50 lg:left-auto lg:right-10 lg:translate-x-0 w-[90%] sm:w-auto">
                    <button onClick={handleDownload} disabled={isGenerating} className="flex-1 sm:flex-none h-14 px-10 sm:px-16 bg-accent border border-accent/20 text-white rounded-2xl font-black text-xs tracking-[2px] hover:bg-accent/90 transition-all disabled:opacity-40 shadow-2xl flex items-center justify-center gap-3 uppercase">
                      {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} UNDUH WORD (.DOCX)
                    </button>
                  </div>
                  <div className="flex justify-center py-10 sm:py-20 p-4 min-h-full">
                    <div className="transform origin-top scale-[0.35] xs:scale-[0.45] sm:scale-[0.6] md:scale-[0.8] lg:scale-[0.75] xl:scale-[0.85] 2xl:scale-100 transition-transform duration-500">
                      <LetterPreview data={data} onUpdate={updateData} onSwitchToEdit={handleSwitchToEdit} />
                    </div>
                  </div>
                </main>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 right-10 z-[100] bg-ink text-paper px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-paper/10">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <p className="font-black text-[10px] uppercase tracking-widest">{successMessage}</p>
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {showGreetings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-paper rounded-[2rem] p-10 max-w-md w-full relative">
              <div className="text-center">
                <Heart className="w-16 h-16 text-accent mx-auto mb-6" />
                <h2 className="text-3xl font-black text-ink uppercase mb-2 leading-none">Salam Hangat!</h2>
                <p className="text-[10px] font-black text-accent uppercase tracking-[3px] mb-6">DESA TANAH MERAH LAOK</p>
                <p className="text-ink/60 font-medium mb-10 text-lg">Semoga hari Anda penuh berkah, sehat, dan rezeki yang melimpah.</p>
                <button onClick={closeGreeting} className="w-full py-5 bg-ink text-paper rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-accent transition-colors">MULAI EKSPLORASI</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
