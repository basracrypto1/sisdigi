import React, { useState, useEffect } from 'react';
import { LetterData, INITIAL_DATA } from '../types';
import { 
  Settings as SettingsIcon, Landmark, Image as ImageIcon, 
  Trash2, Upload, CheckCircle2, RefreshCw, Smartphone, 
  Globe, Shield, Database, Trash, Info, ExternalLink, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  // We use current data as a template or reference for global defaults
  currentData: LetterData;
  onUpdateDefaults: (defaults: Partial<LetterData>) => void;
  onClearDatabase: () => void;
}

export const Settings: React.FC<Props> = ({ currentData, onUpdateDefaults, onClearDatabase }) => {
  const [activeTab, setActiveTab] = useState<'umum' | 'lanjutan' | 'sistem'>('umum');
  const [showSuccess, setShowSuccess] = useState(false);
  const [config, setConfig] = useState(currentData);

  useEffect(() => {
    setConfig(currentData);
  }, [currentData]);

  const handleSave = () => {
    onUpdateDefaults(config);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setConfig({ ...config, logoKabupaten: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const inputStyle = "w-full py-4 bg-bg border border-line rounded-2xl px-6 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none font-bold text-sm transition-all placeholder:text-ink/20";
  const labelStyle = "block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-3 ml-1 font-heading";

  return (
    <div className="flex flex-col h-full bg-bg p-4 sm:p-8 md:p-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-ink tracking-tight uppercase">Pengaturan</h2>
          </div>
          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[3px] ml-13">Konfigurasi & Manajemen Sistem</p>
        </div>

        <button 
          onClick={handleSave}
          className="px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-xl shadow-accent/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
        >
          <CheckCircle2 className="w-4 h-4" /> SIMPAN PERUBAHAN
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-hidden">
        {/* Nav Sidebar */}
        <div className="lg:w-64 space-y-2">
          {[
            { id: 'umum', label: 'Profil Instansi', icon: Landmark },
            { id: 'lanjutan', label: 'Tanda Tangan', icon: Shield },
            { id: 'sistem', label: 'Pemeliharaan', icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                w-full flex items-center gap-4 px-5 py-5 rounded-2xl transition-all group
                ${activeTab === tab.id 
                  ? 'bg-white border-accent shadow-xl shadow-accent/5' 
                  : 'text-ink/40 hover:bg-white'}
              `}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-accent' : 'text-ink/20'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[2px] ${activeTab === tab.id ? 'text-ink' : ''}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-line rounded-[3rem] p-8 sm:p-12 overflow-y-auto no-scrollbar shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl space-y-10"
            >
              {activeTab === 'umum' && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className={labelStyle}>Logo Instansi / Kabupaten</label>
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-bg rounded-3xl border border-line flex items-center justify-center overflow-hidden relative group shrink-0">
                          {config.logoKabupaten ? (
                            <>
                              <img src={config.logoKabupaten} alt="Logo" className="w-full h-full object-contain p-3" referrerPolicy="no-referrer" />
                              <button onClick={() => setConfig({ ...config, logoKabupaten: '' })} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="w-10 h-10 text-ink/10" />
                          )}
                        </div>
                        <label className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-line rounded-3xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all text-center">
                          <Upload className="w-5 h-5 text-accent mb-2" />
                          <p className="text-[10px] font-bold text-ink/60 uppercase tracking-widest leading-none">Pilih Logo Baru</p>
                          <p className="text-[8px] text-ink/20 mt-1 uppercase tracking-widest font-bold">PNG / JPG (MAX 2MB)</p>
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className={labelStyle}>Kabupaten</label>
                        <input type="text" value={config.kabupaten} onChange={e => setConfig({...config, kabupaten: e.target.value})} className={inputStyle} />
                      </div>
                      <div>
                        <label className={labelStyle}>Kecamatan</label>
                        <input type="text" value={config.kecamatan} onChange={e => setConfig({...config, kecamatan: e.target.value})} className={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label className={labelStyle}>Nama Instansi / Organisasi / Desa</label>
                      <input 
                        list="desaList"
                        type="text" 
                        value={config.desa} 
                        onChange={e => setConfig({...config, desa: e.target.value})} 
                        className={inputStyle} 
                        placeholder="Pilih atau ketik nama desa..."
                      />
                      <datalist id="desaList">
                        {[
                          "Tanah Merah Laok", "Tanah Merah Dajah", "Baipajung", "Basanah", 
                          "Batangan", "Buddan", "Dlambah Dajah", "Dlambah Laok", "Dumajah", 
                          "Jangkar", "Kendaban", "Kranggan Barat", "Landak", "Mrecah", 
                          "Pacentan", "Padurungan", "Pangeleyan", "Patemon", "Petrah", 
                          "Pettong", "Poter", "Rongdurin", "Tlomar"
                        ].map(desa => (
                          <option key={desa} value={desa} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className={labelStyle}>Alamat Lengkap / Keterangan Lokasi</label>
                      <textarea value={config.alamatDesa} onChange={e => setConfig({...config, alamatDesa: e.target.value})} className={`${inputStyle} h-24 resize-none`} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'lanjutan' && (
                <div className="space-y-8">
                  <div className="p-6 bg-accent/5 border border-accent/10 rounded-3xl flex items-start gap-4">
                    <Info className="w-5 h-5 text-accent shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-tight mb-1">Informasi Pejabat</p>
                      <p className="text-[9px] text-ink/60 font-bold uppercase tracking-wide leading-relaxed">
                        Data ini digunakan sebagai tanda tangan default pada setiap dokumen yang diterbitkan.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className={labelStyle}>Nama Lengkap Penandatangan</label>
                      <input type="text" value={config.namaKades} onChange={e => setConfig({...config, namaKades: e.target.value})} className={inputStyle} />
                    </div>
                    <div>
                      <label className={labelStyle}>Jabatan Resmi</label>
                      <input type="text" value={config.jabatanKades} onChange={e => setConfig({...config, jabatanKades: e.target.value})} className={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cloud' && (
                <div className="space-y-8">
                  <div className="p-6 bg-green-50 border border-green-100 rounded-3xl flex items-start gap-4">
                    <Globe className="w-5 h-5 text-green-600 shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest leading-tight mb-1">Google Sheets (via App Script)</p>
                      <p className="text-[9px] text-green-600/70 font-bold uppercase tracking-wide leading-relaxed">
                        Metode ini tidak memerlukan login Google di aplikasi. Cukup pasang script di Google Sheets Anda dan masukkan URL-nya di sini.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-bg border border-line rounded-3xl">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-ink">Aktifkan Sinkronisasi</p>
                        <p className="text-[8px] font-bold text-ink/30 uppercase mt-0.5">Simpan ke Google Sheets secara otomatis</p>
                      </div>
                      <button 
                        onClick={() => setConfig({ ...config, googleSheetEnabled: !config.googleSheetEnabled })}
                        className={`w-12 h-6 rounded-full transition-all relative ${config.googleSheetEnabled ? 'bg-accent' : 'bg-line'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.googleSheetEnabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div>
                      <label className={labelStyle}>URL Google App Script Web App</label>
                      <input 
                        type="text" 
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={config.googleAppScriptUrl || ''} 
                        onChange={e => setConfig({...config, googleAppScriptUrl: e.target.value})} 
                        className={inputStyle} 
                      />
                      <p className="mt-4 text-[8px] font-bold text-ink/20 uppercase tracking-[2px] leading-relaxed">
                        * PASTIKAN SCRIPT SUDAH DI-DEPLOY SEBAGAI "WEB APP" DENGAN AKSES "ANYONE".
                      </p>
                    </div>

                    <div className="p-6 bg-bg border border-line rounded-3xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ink mb-4">Cara Mendapatkan URL:</p>
                      <ol className="list-decimal list-inside space-y-2 text-[9px] font-bold text-ink/40 uppercase tracking-wide">
                        <li>BUKA GOOGLE SHEETS ANDA</li>
                        <li>MENU: EXTENSIONS &gt; APPS SCRIPT</li>
                        <li>PASTE KODE SCRIPT YANG SAYA BERIKAN</li>
                        <li>KLIK: DEPLOY &gt; NEW DEPLOYMENT</li>
                        <li>SELECT TYPE: WEB APP</li>
                        <li>WHO HAS ACCESS: ANYONE</li>
                        <li>SALIN URL WEB APP DAN PASTE DI ATAS</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sistem' && (
                <div className="space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[3px] text-ink/20">Manajemen Database</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 bg-bg border border-line rounded-3xl space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <RefreshCw className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-ink">Reset Penomoran</p>
                            <p className="text-[7px] font-bold text-ink/30 uppercase mt-0.5">Kembalikan counter ke 1</p>
                          </div>
                        </div>
                        <button className="w-full py-3 bg-white border border-line rounded-xl text-[9px] font-black uppercase tracking-widest text-ink/40 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all">
                          RESET NOMOR
                        </button>
                      </div>

                      <div className="p-6 bg-bg border border-line rounded-3xl space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <Trash className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-ink">Hapus Semua Data</p>
                            <p className="text-[7px] font-bold text-ink/30 uppercase mt-0.5">Wipe Out Database</p>
                          </div>
                        </div>
                        <button onClick={onClearDatabase} className="w-full py-3 bg-white border border-line rounded-xl text-[9px] font-black uppercase tracking-widest text-ink/40 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                          WIPE DATA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-ink rounded-[2.5rem] text-paper/40 relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-paper/10 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-paper" />
                        </div>
                        <div>
                          <h4 className="text-paper font-black text-xs uppercase tracking-[3px]">SISDIGI PRO</h4>
                          <p className="text-[8px] font-bold uppercase tracking-[2px] opacity-50">Version 2.4.0 (Enterprise)</p>
                        </div>
                      </div>
                      <p className="text-[9px] leading-relaxed uppercase tracking-widest font-bold">
                        Sistem Informasi Surat Digital dikembangkan untuk efisiensi administrasi dokumen. Menggunakan kecerdasan buatan untuk membantu narasi surat.
                      </p>
                      <div className="flex gap-4">
                        <div className="px-4 py-2 border border-paper/10 rounded-lg text-[8px] font-black tracking-widest">STABLE RELEASE</div>
                        <div className="px-4 py-2 border border-paper/10 rounded-lg text-[8px] font-black tracking-widest flex items-center gap-2">
                          <Smartphone className="w-3 h-3" /> MOBILE READY
                        </div>
                      </div>
                    </div>
                    <Database className="absolute -bottom-10 -right-10 w-40 h-40 text-paper/5 rotate-12" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-[200] bg-ink text-paper px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-paper/10"
          >
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-paper" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px]">Pengaturan Disimpan</p>
              <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Konfigurasi berhasil diperbarui</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
