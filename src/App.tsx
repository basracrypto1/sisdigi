/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { LetterData, INITIAL_DATA, SavedLetter } from './types';
import { LetterForm, LetterFormHandle, FormSection } from './components/LetterForm';
import { LetterPreview } from './components/LetterPreview';
import { Dashboard } from './components/Dashboard';
import { Sidebar, PageId } from './components/Sidebar';
import { DataWarga } from './components/DataWarga';
import { Arsip } from './components/Arsip';
import { Settings } from './components/Settings';
import { Citizen } from './types';
import { generateWordLetter } from './lib/wordGenerator';
import { generatePdfLetter } from './lib/pdfGenerator';
import { generateLetterNumber } from './lib/utils';
import { Menu, Download, FileText, CheckCircle2, RefreshCw, History, Heart, X, FileDown, Sparkles, Layout, Edit3, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const getInitialCounter = () => {
    try {
      const saved = localStorage.getItem('surt_counter');
      return saved ? parseInt(saved, 10) || 1 : 1;
    } catch {
      return 1;
    }
  };

  const getInitialHistory = (): SavedLetter[] => {
    try {
      const saved = localStorage.getItem('surt_history');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Corrupted history in storage, clearing...");
      localStorage.removeItem('surt_history');
      return [];
    }
  };

  const [counter, setCounter] = useState(getInitialCounter);
  const [history, setHistory] = useState<SavedLetter[]>(getInitialHistory);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<LetterData>(() => ({
    ...INITIAL_DATA,
    id: crypto.randomUUID(),
    nomorSurat: generateLetterNumber(getInitialCounter()),
    tanggalSurat: new Date().toISOString().split('T')[0]
  }));
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('File Word berhasil diunduh.');
  const [showGreetings, setShowGreetings] = useState(false);
  const formRef = useRef<LetterFormHandle>(null);

  useEffect(() => {
    // Check for shared data in URL
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');
    if (sharedData) {
      import('./lib/share').then(({ decodeLetterData }) => {
        const decoded = decodeLetterData(sharedData);
        if (decoded) {
          setData({ ...decoded, id: crypto.randomUUID() });
          // Clear URL parameter without refreshing
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }
    
    // Initial fetch from Supabase
    fetchHistory();
    
    // Show greeting on first load of session
    const hasSeenGreeting = sessionStorage.getItem('hasSeenGreeting');
    if (!hasSeenGreeting) {
      const timer = setTimeout(() => setShowGreetings(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

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
    // Sync numbering if counter changes from other source or internal logic
    updateData({ nomorSurat: generateLetterNumber(counter) });
  }, [counter]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/letters');
      if (res.ok) {
        const letters = await res.json();
        setHistory(letters);
        localStorage.setItem('surt_history', JSON.stringify(letters.slice(-50)));
      } else {
        // Fallback to local if API fails
        const saved = localStorage.getItem('surt_history');
        if (saved) setHistory(JSON.parse(saved));
      }
    } catch (err) {
      const saved = localStorage.getItem('surt_history');
      if (saved) setHistory(JSON.parse(saved));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveToHistory = async () => {
    const newEntry = { ...data, updatedAt: new Date().toISOString() };
    
    // Optimistic local update
    const updatedHistory = [newEntry, ...history.filter(l => l.id !== data.id)].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('surt_history', JSON.stringify(updatedHistory));

    try {
      await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
    } catch (err) {
      console.error("Failed to sync with Supabase");
    }
  };

  const deleteFromHistory = async (combinedId: string) => {
    const id = combinedId.substring(0, 36);
    
    // Optimistic local update
    const updatedHistory = history.filter(l => l.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('surt_history', JSON.stringify(updatedHistory));

    try {
      await fetch(`/api/letters/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete from Supabase");
    }
  };

  const loadFromHistory = (letter: SavedLetter) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    localStorage.setItem('surt_counter', nextCounter.toString());
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await generateWordLetter(data);
      setSuccessMessage('File Word berhasil diunduh.');
      setShowSuccess(true);
      
      saveToHistory();
      incrementCounter();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      // Error logging suppressed as per user request
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      
      // Ensure preview is visible for html2canvas to work correctly
      if (activeTab === 'edit' && window.innerWidth < 1024) {
        setActiveTab('preview');
        // Give a small delay for the DOM to update visibility
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await generatePdfLetter(data);
      setSuccessMessage('File PDF berhasil diunduh.');
      setShowSuccess(true);
      
      saveToHistory();
      incrementCounter();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Gagal membuat PDF. Silakan coba lagi.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleRefreshNumber = () => {
    updateData({ nomorSurat: generateLetterNumber(counter) });
  };

  const handleUpdate = (update: Partial<LetterData>) => {
    updateData(update);
  };

  const handleSwitchToEdit = (section?: string) => {
    setActiveTab('edit');
    if (section && formRef.current) {
      formRef.current.setSection(section as FormSection);
    }
  };

  const handleReset = () => {
    setData(prev => ({
      ...INITIAL_DATA,
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen max-w-[2000px] mx-auto bg-bg text-ink font-sans selection:bg-accent selection:text-white transition-colors duration-500 overflow-hidden shadow-2xl relative">
      <Sidebar 
        activePage={currentPage} 
        onPageChange={setCurrentPage} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative lg:pl-72">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex-shrink-0 bg-white border-b border-line flex items-center justify-between px-6 z-50">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-ink hover:text-accent transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-display text-lg leading-none font-black text-ink tracking-tight uppercase">
              SIS<span className="text-accent underline decoration-accent/20 decoration-2 underline-offset-2">DIGI</span>
            </h1>
            <p className="text-[6px] uppercase tracking-[2px] font-bold text-ink/30 font-heading">SURAT DIGITAL</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 h-full overflow-hidden relative bg-bg">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-y-auto no-scrollbar">
                <Dashboard 
                  history={history} 
                  fullPage 
                  onClose={() => {}} 
                  onStartWriting={() => setCurrentPage('buat-surat')}
                />
              </motion.div>
            )}

            {currentPage === 'warga' && (
              <motion.div key="warga" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <DataWarga onSelectCitizen={handleSelectCitizen} />
              </motion.div>
            )}

            {currentPage === 'arsip' && (
              <motion.div key="arsip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <Arsip 
                  history={history} 
                  onSelect={loadFromHistory} 
                  onDelete={deleteFromHistory} 
                />
              </motion.div>
            )}

            {currentPage === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                <Settings 
                  currentData={data} 
                  onUpdateDefaults={(defaults) => updateData(defaults)} 
                />
              </motion.div>
            )}

            {currentPage === 'buat-surat' && (
              <motion.div key="buat-surat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col lg:flex-row relative">
                {/* Mobile Tab Toggle */}
                <div className="lg:hidden flex border-b border-line bg-white flex-shrink-0 z-50">
                  <button 
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-ink/40'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> Edit Data
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-ink/40'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Preview
                    </div>
                  </button>
                </div>

                {/* Sidebar / Form Area */}
                <aside className={`
                  w-full lg:w-[400px] xl:w-[480px] h-full flex flex-col bg-bg border-r border-line overflow-y-auto no-scrollbar
                  ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}
                `}>
                  <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-1">
                    <LetterForm 
                      ref={formRef}
                      data={data} 
                      onChange={updateData} 
                      onRefreshNumber={handleRefreshNumber}
                      onFinish={() => setActiveTab('preview')}
                    />
                  </div>
                  
                  {/* Action Buttons at bottom of sidebar */}
                  <div className="p-6 md:p-8 lg:p-10 pt-0 space-y-3 mt-auto border-line/10">
                    <button
                      onClick={handleReset}
                      className="w-full flex items-center justify-center gap-3 bg-accent/5 border border-accent/20 text-accent rounded-2xl font-black text-[10px] tracking-[2px] py-4.5 hover:bg-accent hover:text-white transition-all group font-heading shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                      BERSIHKAN FORM
                    </button>
                    
                    <div className="flex flex-col items-center px-1 pt-3 opacity-30 gap-1">
                      <span className="text-[7px] uppercase tracking-[3px] font-bold font-heading">Digitalization by</span>
                      <span className="text-[10px] font-extrabold text-ink transition-colors underline decoration-accent/20">FAHRUL ANAM</span>
                    </div>
                  </div>
                </aside>

                {/* Preview Pane */}
                <main className={`
                  flex-1 h-full bg-preview-bg overflow-y-auto no-scrollbar scroll-smooth relative
                  ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}
                `}>
                   {/* Floating controls for preview */}
                   <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50 no-print max-w-[90vw] lg:left-auto lg:right-10 lg:translate-x-0">
                    <button
                      onClick={handleDownload}
                      disabled={isGenerating || isPdfGenerating}
                      className="flex-1 sm:flex-none h-14 px-10 bg-white border border-line text-ink rounded-[1.5rem] font-black text-[10px] tracking-[3px] hover:bg-ink hover:text-white active:scale-95 transition-all disabled:opacity-40 shadow-2xl flex items-center justify-center gap-3 group"
                    >
                      {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                      WORD
                    </button>
                    
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isGenerating || isPdfGenerating}
                      className="flex-1 sm:flex-none h-14 px-10 bg-accent text-white rounded-[1.5rem] font-black text-[10px] tracking-[3px] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 shadow-2xl shadow-accent/40 flex items-center justify-center gap-3 group"
                    >
                      {isPdfGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
                      PDF
                    </button>
                  </div>

                  <div className="flex flex-col items-center min-w-full min-h-full py-12 lg:py-20">
                    <div className="transform origin-top transition-all duration-700 mb-40 scale-[0.4] xs:scale-[0.48] sm:scale-[0.65] md:scale-[0.8] lg:scale-[0.75] xl:scale-[0.85] 2xl:scale-100 flex justify-center pb-20">
                      <LetterPreview 
                        data={data} 
                        onUpdate={handleUpdate} 
                        onSwitchToEdit={handleSwitchToEdit}
                      />
                    </div>
                  </div>
                </main>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global UI Elements */}
        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 right-10 z-[100] bg-ink text-paper px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-paper/10">
              <div className="bg-accent p-1 rounded-full"><CheckCircle2 className="w-5 h-5 text-paper" /></div>
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest">Berhasil</p>
                <p className="text-[9px] font-bold uppercase opacity-40">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {showError && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-28 right-10 z-[100] bg-red-600 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
              <div className="bg-white/20 p-1 rounded-full"><X className="w-5 h-5 text-white" /></div>
              <div>
                <p className="font-black text-[10px] uppercase tracking-widest">Kesalahan</p>
                <p className="text-[9px] font-bold uppercase opacity-80">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Greetings Popup - Refined Premium Design */}
      <AnimatePresence>
        {showGreetings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-paper rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] max-w-[420px] w-full relative overflow-hidden group"
            >
              {/* Top Accent Bar */}
              <div className="h-2 bg-accent w-full" />
              
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                {/* Icon Section */}
                <div className="relative mb-10 mt-2">
                  <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative z-10 w-24 h-24 bg-bg border border-line flex items-center justify-center rounded-[2rem] shadow-sm transform transition-transform group-hover:scale-105 duration-700">
                    <Heart className="w-12 h-12 text-accent fill-accent/5 animate-pulse" strokeWidth={1} />
                  </div>
                </div>

                {/* Content Section */}
                <div className="space-y-3 mb-8">
                  <div className="inline-block px-3 py-1 bg-accent/5 border border-accent/10 rounded-full">
                    <span className="text-[9px] font-black text-accent uppercase tracking-[3px] font-heading">Pesan Kehangatan</span>
                  </div>
                  <h2 className="text-4xl font-extrabold text-ink leading-[0.9] tracking-tighter font-display uppercase">
                    Salam <br /> <span className="text-accent underline decoration-accent/10 decoration-4 underline-offset-4">Hangat!</span>
                  </h2>
                </div>

                <div className="w-16 h-[1px] bg-line mb-8" />

                <div className="text-ink/60 font-medium leading-relaxed mb-10 px-6 font-sans">
                  <p className="text-base sm:text-lg tracking-tight">
                    Semoga hari Anda penuh berkah, <br /> 
                    sehat, dan rezeki yang melimpah.
                  </p>
                </div>

                {/* Action Button */}
                <button 
                  onClick={closeGreeting}
                  className="w-full relative group/btn overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-accent transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-in-out" />
                  <div className="relative py-4.5 bg-ink text-paper font-bold uppercase tracking-[3px] text-[10px] flex items-center justify-center gap-2 group-hover/btn:text-paper transition-colors duration-500 font-heading">
                    Mulai Eksplorasi
                  </div>
                </button>

                {/* Footer Credits */}
                <div className="mt-12 pt-8 border-t border-line w-full flex justify-center opacity-30">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[7px] uppercase tracking-[4px] font-bold font-heading">Digitalization by</span>
                    <span className="text-[10px] font-extrabold font-accent">FAHRUL ANAM</span>
                  </div>
                </div>

                {/* Close Button X */}
                <button 
                  onClick={closeGreeting}
                  className="absolute top-6 right-6 p-2 text-ink/20 hover:text-ink transition-all hover:bg-bg rounded-xl"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Decorative Subtle Pattern */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
