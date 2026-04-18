/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { LetterData, INITIAL_DATA, SavedLetter } from './types';
import { LetterForm, LetterFormHandle, FormSection } from './components/LetterForm';
import { LetterPreview } from './components/LetterPreview';
import { LetterHistory } from './components/LetterHistory';
import { generateWordLetter } from './lib/wordGenerator';
import { generateLetterNumber } from './lib/utils';
import { Download, FileText, CheckCircle2, RefreshCw, History, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const getInitialCounter = () => {
    const saved = localStorage.getItem('surt_counter');
    return saved ? parseInt(saved, 10) : 1;
  };

  const getInitialHistory = (): SavedLetter[] => {
    const saved = localStorage.getItem('surt_history');
    return saved ? JSON.parse(saved) : [];
  };

  const [counter, setCounter] = useState(getInitialCounter);
  const [history, setHistory] = useState<SavedLetter[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [data, setData] = useState<LetterData>(() => ({
    ...INITIAL_DATA,
    id: crypto.randomUUID(),
    nomorSurat: generateLetterNumber(getInitialCounter()),
    tanggalSurat: new Date().toISOString().split('T')[0]
  }));
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGreetings, setShowGreetings] = useState(false);
  const formRef = useRef<LetterFormHandle>(null);

  useEffect(() => {
    // Show greetings after 1.5s
    const timer = setTimeout(() => {
      setShowGreetings(true);
    }, 1500);

    // Initial fetch
    fetchHistory();
    
    return () => clearTimeout(timer);
  }, []);

  const fetchHistory = () => {
    const saved = localStorage.getItem('surt_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
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
        return val;
      };

      return sanitize(next);
    });
  };

  useEffect(() => {
    // Sync numbering if counter changes from other source or internal logic
    updateData({ nomorSurat: generateLetterNumber(counter) });
  }, [counter]);

  const saveToHistory = () => {
    const saved = localStorage.getItem('surt_history');
    const letters = saved ? JSON.parse(saved) : [];
    
    const index = letters.findIndex((l: any) => l.id === data.id);
    const newEntry = { ...data, updatedAt: new Date().toISOString() };
    
    if (index > -1) {
      letters[index] = newEntry;
    } else {
      letters.push(newEntry);
    }
    
    // Keep only last 50 letters locally
    const trimmed = letters.slice(-50);
    localStorage.setItem('surt_history', JSON.stringify(trimmed));
    setHistory(trimmed);
  };

  const deleteFromHistory = (combinedId: string) => {
    const id = combinedId.substring(0, 36);
    const saved = localStorage.getItem('surt_history');
    if (saved) {
      let letters = JSON.parse(saved);
      letters = letters.filter((l: any) => l.id !== id);
      localStorage.setItem('surt_history', JSON.stringify(letters));
      setHistory(letters);
    }
  };

  const loadFromHistory = (letter: SavedLetter) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...letterData } = letter;
    updateData(letterData);
    setShowHistory(false);
    setActiveTab('edit');
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

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-bg overflow-hidden font-sans">
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
            <CheckCircle2 className="w-4 h-4" /> Hasil Preview
          </div>
        </button>
      </div>

      {/* Sidebar / Form Area */}
      <aside className={`
        w-full lg:w-[480px] h-full flex flex-col bg-bg border-r border-line overflow-y-auto no-scrollbar
        ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="p-6 md:p-8 lg:p-10 flex-1">
          <LetterForm 
            ref={formRef}
            data={data} 
            onChange={updateData} 
            onRefreshNumber={handleRefreshNumber}
          />
        </div>
        
        {/* Action Buttons at bottom of sidebar */}
        <div className="p-6 md:p-8 space-y-3 bg-paper/80 border-t border-line backdrop-blur-xl sticky bottom-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setShowHistory(true)}
            className="w-full h-12 flex items-center justify-center gap-2 bg-white border border-line text-ink rounded-xl font-bold text-[10px] tracking-widest hover:bg-ink hover:text-white active:scale-95 transition-all shadow-sm group"
          >
            <History className="w-4 h-4 group-hover:rotate-[-20deg] transition-transform" /> RIWAYAT SURAT
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full h-14 flex items-center justify-center gap-3 bg-accent text-paper rounded-xl font-bold text-xs tracking-[2px] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-accent/10 relative overflow-hidden group"
          >
            {isGenerating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                <span>UNDUH FILE WORD (.DOCX)</span>
              </>
            )}
          </button>
          
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-[9px] text-ink/30 italic font-medium">
              *Rekomendasi cetak menggunakan browser desktop
            </p>
            
            <a 
              href="https://www.tiktok.com/@me.fahrulanam" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-0.5"
            >
              <span className="text-[8px] uppercase tracking-[3px] text-ink/20 font-bold group-hover:text-accent transition-colors">Digitalization by</span>
              <span className="text-[10px] font-bold text-ink/40 group-hover:text-ink transition-colors">Fahrul Anam</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Preview Pane */}
      <main className={`
        flex-1 h-full bg-preview-bg items-start justify-center relative overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-12 no-scrollbar
        ${activeTab === 'edit' ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="fixed top-6 right-6 flex items-center gap-3 z-50">
          <div className="bg-paper/80 border border-line text-ink/40 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[2px] hidden lg:block backdrop-blur-md shadow-sm font-heading">
            Live Preview
          </div>
          <div className="bg-accent text-paper px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[2px] z-50 shadow-lg shadow-accent/20 flex items-center gap-2 font-heading">
            <span className="w-1.5 h-1.5 bg-paper rounded-full animate-pulse" />
            Interactive Editor
          </div>
        </div>
        
        <div className="flex flex-col items-center min-w-full">
          <div className="transform origin-top transition-all duration-500 mb-40 mt-6 sm:mt-12 scale-[0.45] xs:scale-[0.55] sm:scale-75 md:scale-90 xl:scale-100 flex justify-center pb-20">
            <LetterPreview 
              data={data} 
              onUpdate={handleUpdate} 
              onSwitchToEdit={handleSwitchToEdit}
            />
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed bottom-10 right-10 bg-ink text-paper px-8 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-paper/10 z-50"
            >
              <div className="bg-accent p-1 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-paper" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wider">Success</p>
                <p className="text-xs opacity-60">File Word berhasil diunduh.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <LetterHistory 
            history={history}
            onSelect={loadFromHistory}
            onDelete={deleteFromHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreetings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/30 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, rotate: -2 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-paper border-2 border-line rounded-[2rem] p-8 max-w-[320px] w-full relative shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] text-center group"
            >
              <button 
                onClick={() => setShowGreetings(false)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-line rounded-full flex items-center justify-center text-ink/20 hover:text-red-500 hover:scale-110 active:scale-95 transition-all shadow-lg z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-700">
                <Heart className="w-8 h-8 text-accent fill-accent animate-pulse" />
              </div>
              
              <h3 className="font-display text-xl font-bold text-ink mb-3 tracking-tight leading-tight">
                Salam Hangat!
              </h3>
              
              <p className="text-ink/60 font-medium leading-relaxed font-sans text-sm">
                Semoga kita selalu sehat dan lancar rezeki 🙏 <span className="text-accent font-extrabold underline decoration-accent/20 underline-offset-4">Amin.</span>
              </p>

              <div className="mt-8">
                <button 
                  onClick={() => setShowGreetings(false)}
                  className="w-full py-4 bg-ink text-paper rounded-xl font-bold text-[10px] tracking-[3px] uppercase hover:bg-accent transition-all shadow-md active:scale-95"
                >
                  TUTUP PESAN
                </button>
              </div>
              
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-accent/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-accent/10 rounded-full blur-2xl animate-pulse delay-700" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
