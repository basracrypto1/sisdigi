import React, { useState, useMemo } from 'react';
import { SavedLetter } from '../types';
import { Search, Calendar, User, FileText, Trash2, ArrowRight, History, X, Activity, Download, Edit3 } from 'lucide-react';
import { formatDateIndo } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  history: SavedLetter[];
  logs: any[];
  onSelect: (letter: SavedLetter) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onRefreshLogs?: () => void;
}

export const LetterHistory: React.FC<Props> = ({ history, onSelect, onDelete, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    return history
      .filter(item => {
        const name = item.nama || '';
        const title = item.judulSurat || '';
        const number = item.nomorSurat || '';
        const date = item.tanggalSurat || '';
        const dateIndo = formatDateIndo(date);
        const searchStr = `${name} ${title} ${number} ${date} ${dateIndo}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
      });
  }, [history, searchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[100] border-l border-line flex flex-col font-sans"
    >
      <div className="p-6 border-b border-line flex items-center justify-between bg-bg">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink font-heading">Riwayat Surat</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
          <X className="w-5 h-5 text-ink/40" />
        </button>
      </div>

      <div className="p-6 border-b border-line">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="text"
            placeholder="Cari nama, judul, atau tanggal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-bg border border-line rounded-xl text-sm outline-none focus:border-accent transition-all shadow-inner placeholder:text-ink/20 font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div 
              key={item.id + (item.updatedAt || 0)}
              className="group p-4 rounded-xl border border-line bg-white hover:border-accent hover:shadow-md transition-all cursor-pointer relative"
              onClick={() => onSelect(item)}
            >
              <div className="flex justify-between items-start mb-2 pr-8">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/5 px-2 py-0.5 rounded">
                  {item.judulSurat}
                </span>
                <span className="text-[9px] text-ink/30 font-mono">
                  {new Date(item.updatedAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <h3 className="font-bold text-ink text-sm mb-1 group-hover:text-accent transition-colors">
                {item.nama || 'Tanpa Nama'}
              </h3>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-ink/50">
                  <FileText className="w-3 h-3" />
                  <span>{item.nomorSurat || 'No Number'}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-ink/50">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDateIndo(item.tanggalSurat)}</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-accent" />
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 text-ink/20 hover:text-red-500 transition-all hover:bg-red-50 rounded-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-ink/10" />
            </div>
            <p className="text-sm font-bold text-ink/40">Tidak ada riwayat ditemukan</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-bg border-t border-line text-[10px] text-center text-ink/30 uppercase tracking-widest font-bold">
        {history.length} Surat Tersimpan
      </div>
    </motion.div>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-bg rounded-[2rem] flex items-center justify-center mb-6">
      <Icon className="w-7 h-7 text-ink/10" />
    </div>
    <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">{text}</p>
    <p className="text-[9px] text-ink/20 mt-2 uppercase tracking-[2px] leading-relaxed max-w-[200px]">Data akan muncul otomatis setelah ada interaksi sistem</p>
  </div>
);
