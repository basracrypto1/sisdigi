import React, { useState, useEffect } from 'react';
import { Citizen } from '../types';
import { 
  Plus, Search, User, Trash2, Edit3, 
  ChevronRight, Filter, Download, Upload,
  MoreVertical, FileText, CheckCircle2, X,
  Camera, Scan, Loader2, Sparkles, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toTitleCase, toSentenceCase } from '../lib/utils';
import { scanKtp } from '../services/geminiService';
import * as XLSX from 'xlsx';

interface Props {
  onSelectCitizen?: (citizen: Citizen) => void;
}

export const DataWarga: React.FC<Props> = ({ onSelectCitizen }) => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Citizen>>({
    jenisKelamin: 'Laki-laki'
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanKtp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await scanKtp(base64);
          setFormData({
            ...formData,
            ...result,
            // Ensure fields are formatted if AI returns raw casing
            nama: toTitleCase(result.nama || ''),
            tempatLahir: toTitleCase(result.tempatLahir || ''),
            pekerjaan: toTitleCase(result.pekerjaan || ''),
            alamat: toSentenceCase(result.alamat || ''),
          });
        } catch (err: any) {
          setScanError(err.message || "Gagal memproses KTP");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setScanError("Gagal membaca file gambar");
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
    checkLocalData();
  }, []);

  const checkLocalData = () => {
    try {
      const saved = localStorage.getItem('surt_citizens');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasLocalData(true);
        }
      }
    } catch (e) {
      console.error("Local data check error");
    }
  };

  const fetchCitizens = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/citizens');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCitizens(data.map(c => ({
          ...c,
          tempatLahir: c.tempat_lahir,
          tanggalLahir: c.tanggal_lahir,
          jenisKelamin: c.jenis_kelamin,
          updatedAt: c.updated_at
        })));
      }
    } catch (err) {
      console.error("Fetch citizens error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (citizens.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    setIsExporting(true);
    try {
      // Create CSV Header
      const headers = ['ID', 'NIK', 'Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Pekerjaan', 'Alamat', 'Terakhir Diperbarui'];
      
      // Map data to CSV rows
      const rows = citizens.map(c => [
        `"${c.id}"`,
        `'${c.nik}`, // Add single quote to prevent Excel from scientific notation
        `"${c.nama}"`,
        `"${c.tempatLahir}"`,
        `"${c.tanggalLahir}"`,
        `"${c.jenisKelamin}"`,
        `"${c.pekerjaan}"`,
        `"${c.alamat.replace(/\n/g, ' ')}"`,
        `"${c.updatedAt}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Data_Warga_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (citizens.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    setIsExportingExcel(true);
    try {
      // Prepare data for Excel
      const excelData = citizens.map((c, index) => ({
        'No': index + 1,
        'NIK': c.nik,
        'Nama Lengkap': c.nama.toUpperCase(),
        'Tempat Lahir': c.tempatLahir.toUpperCase(),
        'Tanggal Lahir': c.tanggalLahir ? c.tanggalLahir.split('-').reverse().join('-') : '-',
        'Jenis Kelamin': c.jenisKelamin.toUpperCase(),
        'Pekerjaan': c.pekerjaan.toUpperCase(),
        'Alamat': c.alamat.toUpperCase(),
        'Tanggal Update': new Date(c.updatedAt).toLocaleDateString('id-ID')
      }));

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const wscols = [
        { wch: 5 },  // No
        { wch: 20 }, // NIK
        { wch: 25 }, // Nama
        { wch: 20 }, // Tempat Lahir
        { wch: 15 }, // Tanggal Lahir
        { wch: 15 }, // Jenis Kelamin
        { wch: 20 }, // Pekerjaan
        { wch: 40 }, // Alamat
        { wch: 15 }  // Update
      ];
      ws['!cols'] = wscols;

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Warga");

      // Save file
      const filename = `Data_Warga_Desa_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error("Excel Export error:", err);
      alert('Gagal mengekspor ke Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Impor data dari file ini? Pastikan kolom sesuai dengan format ekspor (Nama, NIK, dll). Data dengan NIK yang sama akan diperbarui.')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length <= 1) {
        alert('File kosong atau tidak valid.');
        return;
      }

      // Basic CSV Parser (handling quoted values)
      const parseCSVLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      // Detect column indices based on headers
      const idxNama = headers.findIndex(h => h.toLowerCase().includes('nama'));
      const idxNik = headers.findIndex(h => h.toLowerCase().includes('nik'));
      const idxTempat = headers.findIndex(h => h.toLowerCase().includes('tempat'));
      const idxTgl = headers.findIndex(h => h.toLowerCase().includes('tanggal'));
      const idxGender = headers.findIndex(h => h.toLowerCase().includes('kelamin'));
      const idxJob = headers.findIndex(h => h.toLowerCase().includes('pekerjaan'));
      const idxAlamat = headers.findIndex(h => h.toLowerCase().includes('alamat'));

      if (idxNama === -1 || idxNik === -1) {
        alert('Format file tidak dikenali. Pastikan file memiliki kolom Nama dan NIK.');
        return;
      }

      const rawData = lines.slice(1).map(line => {
        const parts = parseCSVLine(line);
        return {
          id: crypto.randomUUID(),
          nama: toTitleCase(parts[idxNama] || ''),
          nik: (parts[idxNik] || '').replace(/'/g, '').replace(/\D/g, ''), // Clean NIK from Excel junk
          tempatLahir: toTitleCase(parts[idxTempat] || ''),
          tanggalLahir: parts[idxTgl] || null,
          jenisKelamin: (parts[idxGender] || 'Laki-laki').includes('P') ? 'Perempuan' : 'Laki-laki',
          pekerjaan: toTitleCase(parts[idxJob] || ''),
          alamat: toSentenceCase(parts[idxAlamat] || ''),
        };
      }).filter(c => c.nik && c.nama);

      const res = await fetch('/api/citizens/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawData)
      });

      if (!res.ok) throw new Error("Gagal mengunggah data");

      alert(`Berhasil impor ${rawData.length} data warga.`);
      await fetchCitizens();
    } catch (err) {
      console.error("Import error:", err);
      alert('Gagal impor data. Pastikan format file benar.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleMigrate = async () => {
    const saved = localStorage.getItem('surt_citizens');
    if (!saved) return;
    
    setIsMigrating(true);
    try {
      const localCitizens = JSON.parse(saved);
      const res = await fetch('/api/citizens/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localCitizens)
      });
      
      if (res.ok) {
        localStorage.removeItem('surt_citizens');
        setHasLocalData(false);
        await fetchCitizens();
        alert('Migrasi data berhasil! Semua data warga sekarang ada di database.');
      }
    } catch (err) {
      console.error("Migration error:", err);
      alert('Gagal migrasi data.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setScanError(null);
    
    try {
      const citizenData = {
        ...formData,
        id: editingCitizen?.id || crypto.randomUUID(),
      };

      const res = await fetch('/api/citizens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citizenData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyimpan ke database");
      }

      await fetchCitizens();
      setShowAddModal(false);
      setEditingCitizen(null);
      setFormData({ jenisKelamin: 'Laki-laki' });
    } catch (err: any) {
      console.error("Submit citizen error:", err);
      setScanError(err.message || "Gagal menyimpan data. Pastikan tabel 'citizens' sudah dibuat di Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data warga ini?')) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/citizens/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCitizens();
      }
    } catch (err) {
      console.error("Delete citizen error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = citizens.filter(c => 
    c.nama.toLowerCase().includes(search.toLowerCase()) || 
    c.nik.includes(search)
  );

  return (
    <div className="flex flex-col h-full bg-bg p-4 sm:p-8 md:p-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-3xl font-black text-ink tracking-tight uppercase">Data Warga</h2>
          </div>
          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[3px] ml-13">Direktori Kependudukan Desa</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              disabled={isImporting}
            />
            <button 
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-line text-ink/60 rounded-2xl font-black text-[9px] uppercase tracking-[2px] transition-all hover:bg-ink hover:text-white disabled:opacity-30"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              IMPOR CSV
            </button>
          </div>
          <button 
            onClick={handleExportExcel}
            disabled={isExportingExcel || citizens.length === 0}
            className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-black text-[9px] uppercase tracking-[2px] transition-all hover:bg-green-600 hover:text-white disabled:opacity-30"
          >
            {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            EKSPOR EXCEL
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting || citizens.length === 0}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-line text-ink/60 rounded-2xl font-black text-[9px] uppercase tracking-[2px] transition-all hover:bg-ink hover:text-white disabled:opacity-30"
          >
            <Download className="w-4 h-4" />
            EKSPOR CSV
          </button>
          {hasLocalData && (
            <button 
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex items-center gap-2 px-4 py-3 bg-paper border border-accent text-accent rounded-2xl font-black text-[9px] uppercase tracking-[2px] transition-all hover:bg-accent hover:text-white disabled:opacity-50"
              title="Pindahkan data dari browser ke database permanen"
            >
              {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              MIGRASI KE DB
            </button>
          )}
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="CARI NAMA ATAU NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-line rounded-2xl text-[10px] uppercase font-bold tracking-widest focus:border-accent outline-none shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={() => {
              setEditingCitizen(null);
              setFormData({ jenisKelamin: 'Laki-laki' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-3 px-6 py-3 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> TAMBAH WARGA
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((citizen) => (
              <motion.div 
                layout
                key={citizen.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-line rounded-3xl p-6 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:scale-150" />
                
                <div className="flex items-start justify-between relative z-10 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-bg border border-line flex items-center justify-center flex-shrink-0">
                      <User className="w-7 h-7 text-ink/20" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-ink uppercase tracking-tight group-hover:text-accent transition-colors">{citizen.nama}</h4>
                      <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">{citizen.nik}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingCitizen(citizen);
                        setFormData(citizen);
                        setShowAddModal(true);
                      }}
                      className="p-2 hover:bg-bg rounded-xl text-ink/40 hover:text-accent transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(citizen.id)}
                      className="p-2 hover:bg-red-50 rounded-xl text-ink/40 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">Tempat, Tgl Lahir</p>
                      <p className="text-[10px] font-bold text-ink/60 uppercase">{citizen.tempatLahir}, {citizen.tanggalLahir}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">Pekerjaan</p>
                      <p className="text-[10px] font-bold text-ink/60 uppercase">{citizen.pekerjaan}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-ink/20">Alamat</p>
                    <p className="text-[10px] font-bold text-ink/60 uppercase leading-relaxed line-clamp-2">{citizen.alamat}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-line/50 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${citizen.jenisKelamin === 'Laki-laki' ? 'bg-blue-400' : 'bg-pink-400'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-ink/30">{citizen.jenisKelamin}</span>
                  </div>
                  <button 
                    onClick={() => onSelectCitizen?.(citizen)}
                    className="flex items-center gap-2 px-4 py-2 bg-bg hover:bg-accent hover:text-white border border-line rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    GUNAKAN <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-line rounded-[3rem] bg-white/50">
            <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center mb-6">
              <User className="w-10 h-10 text-ink/10" />
            </div>
            <h3 className="text-lg font-black text-ink uppercase tracking-tight mb-2">Belum Ada Data Warga</h3>
            <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[3px] text-center max-w-xs">Mulai isi direktori warga untuk mempermudah pembuatan surat di masa depan.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-10 px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
            >
              TAMBAH DATA PERTAMA
            </button>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-paper rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="h-2 bg-accent" />
              <div className="p-8 sm:p-10 flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-ink uppercase tracking-tight">{editingCitizen ? 'Edit Data Warga' : 'Warga Baru'}</h3>
                    <p className="text-[9px] font-black text-accent uppercase tracking-[3px] mt-1">Formulir Kependudukan</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-3 bg-bg border border-line rounded-2xl hover:text-red-500 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 no-scrollbar">
                  {scanError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <X className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{scanError}</p>
                    </div>
                  )}

                  {/* KTP Scan Integration */}
                  {!editingCitizen && (
                    <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl space-y-4 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ink">Smart Scan KTP</p>
                            <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Ekstrak Data Otomatis</p>
                          </div>
                        </div>
                        {isScanning && (
                          <div className="flex items-center gap-2 text-accent">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Memproses...</span>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          capture="environment"
                          onChange={handleScanKtp}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          disabled={isScanning}
                        />
                        <div className="w-full py-4 border-2 border-dashed border-accent/20 rounded-2xl flex items-center justify-center gap-3 bg-white hover:bg-accent/5 transition-all">
                          <Scan className="w-4 h-4 text-accent" />
                          <span className="text-[9px] font-black uppercase tracking-[2px] text-accent">PILIH FOTO ATAU AMBIL GAMBAR KTP</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      value={formData.nama || ''}
                      onChange={e => setFormData({...formData, nama: toTitleCase(e.target.value)})}
                      className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all uppercase tracking-wide" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">NIK</label>
                      <input 
                        required
                        type="text" 
                        value={formData.nik || ''}
                        onChange={e => setFormData({...formData, nik: e.target.value})}
                        className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">Jenis Kelamin</label>
                      <select 
                        value={formData.jenisKelamin}
                        onChange={e => setFormData({...formData, jenisKelamin: e.target.value as any})}
                        className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">Tempat Lahir</label>
                      <input 
                        required
                        type="text" 
                        value={formData.tempatLahir || ''}
                        onChange={e => setFormData({...formData, tempatLahir: toTitleCase(e.target.value)})}
                        className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all uppercase" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">Tanggal Lahir</label>
                      <input 
                        required
                        type="date" 
                        value={formData.tanggalLahir || ''}
                        onChange={e => setFormData({...formData, tanggalLahir: e.target.value})}
                        className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">Pekerjaan</label>
                    <input 
                      required
                      type="text" 
                      value={formData.pekerjaan || ''}
                      onChange={e => setFormData({...formData, pekerjaan: toTitleCase(e.target.value)})}
                      className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all uppercase" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1">Alamat Lengkap</label>
                    <textarea 
                      required
                      value={formData.alamat || ''}
                      onChange={e => setFormData({...formData, alamat: toSentenceCase(e.target.value)})}
                      className="w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent outline-none font-bold text-sm transition-all uppercase resize-none h-32" 
                    />
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-5 bg-bg border border-line text-ink rounded-[1.5rem] font-black text-[10px] uppercase tracking-[3px] hover:bg-ink hover:text-white transition-all"
                    >
                      BATAL
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] py-5 bg-accent text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[3px] shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      SIMPAN DATA
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
