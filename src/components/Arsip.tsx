import React, { useState } from 'react';
import { SavedLetter } from '../types';
import { 
  Archive, Search, Filter, Calendar, 
  Trash2, FileDown, Eye, MoreVertical,
  ChevronRight, FileText, LayoutGrid, List as ListIcon,
  Download, Clock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  history: SavedLetter[];
  onSelect: (letter: SavedLetter) => void;
  onDelete: (id: string) => void;
}

export const Arsip: React.FC<Props> = ({ history, onSelect, onDelete }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filtered = history.filter(l => 
    l.nama.toLowerCase().includes(search.toLowerCase()) || 
    l.judulSurat.toLowerCase().includes(search.toLowerCase()) ||
    l.nomorSurat.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-bg p-4 sm:p-8 md:p-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Archive className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-ink tracking-tight uppercase">Surat Diterbitkan</h2>
          </div>
          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[3px] ml-13">Penyimpanan Digital Dokumen</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="CARI SURAT, NAMA, ATAU NOMOR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-line rounded-2xl text-[10px] uppercase font-bold tracking-widest focus:border-accent outline-none shadow-sm transition-all"
            />
          </div>
          
          <div className="flex bg-white border border-line rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-accent text-white' : 'text-ink/20 hover:text-accent'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-ink/20 hover:text-accent'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {filtered.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white border border-line rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-bg/30">
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-ink/30 w-16">No</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-ink/30">Judul & Nomor</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-ink/30">Warga / Pemohon</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-ink/30">Tanggal Terbit</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[2px] text-ink/30 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {filtered.map((letter, idx) => (
                    <tr key={letter.id} className="hover:bg-bg/50 transition-colors group cursor-pointer" onClick={() => onSelect(letter)}>
                      <td className="px-8 py-6 text-xs font-bold text-ink/20 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-ink uppercase tracking-tight group-hover:text-accent transition-colors">{letter.judulSurat}</span>
                          <span className="text-[9px] font-bold text-ink/30 uppercase tracking-[2px] mt-1">{letter.nomorSurat}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-bg border border-line flex items-center justify-center">
                            <User className="w-4 h-4 text-ink/20" />
                          </div>
                          <span className="text-xs font-bold text-ink/70 uppercase">{letter.nama || 'UMUM/LEMABAGA'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-ink/40">
                          <Calendar className="w-3.5 h-3.5 text-accent/40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{formatDate(letter.tanggalSurat)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => onSelect(letter)} className="p-2.5 bg-bg border border-line rounded-xl text-ink/40 hover:text-accent hover:border-accent transition-all" title="Buka Detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(letter.id)} className="p-2.5 bg-bg border border-line rounded-xl text-ink/40 hover:text-red-500 hover:border-red-500 transition-all" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((letter) => (
                <motion.div 
                  layout
                  key={letter.id}
                  onClick={() => onSelect(letter)}
                  className="bg-white border border-line rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 transition-all group cursor-pointer overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText className="w-16 h-16 text-accent -rotate-12" />
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Archive className="w-5 h-5" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-black text-ink uppercase tracking-tight leading-tight line-clamp-2 group-hover:text-accent transition-colors">{letter.judulSurat}</h4>
                      <p className="text-[9px] font-bold text-ink/30 uppercase tracking-[2px]">{letter.nomorSurat}</p>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-bg border border-line flex items-center justify-center">
                          <User className="w-3 h-3 text-ink/20" />
                        </div>
                        <span className="text-[9px] font-black text-ink/60 uppercase truncate">{letter.nama || 'INSTITUSI'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-bg border border-line flex items-center justify-center">
                          <Clock className="w-3 h-3 text-ink/20" />
                        </div>
                        <span className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">{formatDate(letter.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="pt-6 mt-2 border-t border-line/50 flex items-center justify-between">
                      <button className="text-[9px] font-black text-accent flex items-center gap-1 uppercase tracking-widest">
                        DETAIL <ChevronRight className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(letter.id); }}
                        className="text-ink/10 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-line rounded-[3rem] bg-white/50">
            <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center mb-6">
              <Archive className="w-10 h-10 text-ink/10" />
            </div>
            <h3 className="text-lg font-black text-ink uppercase tracking-tight mb-2">Belum Ada Surat Terbit</h3>
            <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[3px] text-center max-w-xs">Setiap surat yang Anda terbitkan akan muncul di sini secara otomatis.</p>
          </div>
        )}
      </div>
    </div>
  );
};
