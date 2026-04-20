import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { LetterData, Heir, Witness, INITIAL_DATA } from '../types';
import { 
  RefreshCw, User, FileText, Briefcase, Users, Plus, Trash2, GraduationCap,
  ShieldCheck, LayoutDashboard, Database, Signature, Settings2, Sparkles, Upload, Landmark, Image as ImageIcon,
  Mail, Phone, Award, ChevronDown, MapPin, ArrowRight, ArrowLeft, Layout, Receipt, Handshake,
  Camera, Scan, Loader2
} from 'lucide-react';
import { AIAssistant } from './AIAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedLetter } from '../services/geminiService';
import { formatRupiah, getRandomProfile, toSentenceCase, toTitleCase } from '../lib/utils';
import { scanKtp } from '../services/geminiService';

interface Props {
  data: LetterData;
  onChange: (data: LetterData) => void;
  onRefreshNumber: () => void;
  onFinish?: () => void;
}

export type FormSection = 'umum' | 'penduduk' | 'waris_saksi' | 'isi' | 'jual_beli' | 'kontak' | 'riwayat' | 'rincian';

export interface LetterFormHandle {
  setSection: (section: FormSection) => void;
}

export const LetterForm = forwardRef<LetterFormHandle, Props>(({ data, onChange, onRefreshNumber, onFinish }, ref) => {
  const [activeSection, setActiveSection] = useState<FormSection>('umum');

  useImperativeHandle(ref, () => ({
    setSection: (section: FormSection) => {
      setActiveSection(section);
    }
  }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File terlalu besar. Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, logoKabupaten: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    onChange({ ...data, logoKabupaten: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-formatting logic
    let finalValue = value;
    const titleCaseFields = ['nama', 'tempatLahir', 'desa', 'kecamatan', 'kabupaten', 'pekerjaan', 'penerima', 'perusahaanTujuan', 'posisiTujuan'];
    const sentenceCaseFields = ['judulSurat', 'keperluan', 'narasiSurat', 'detailObjek', 'alamat', 'alamatDesa', 'memo', 'lampiran', 'tembusan'];

    if (name === 'hargaJualBeli') {
      finalValue = formatRupiah(value);
    } else if (titleCaseFields.includes(name)) {
      finalValue = toTitleCase(value);
    } else if (sentenceCaseFields.includes(name)) {
      finalValue = toSentenceCase(value);
    }

    onChange({ ...data, [name]: finalValue });
  };
  
  const addItem = () => {
    const newItem = { deskripsi: '', kuantitas: 1, satuan: 'Pcs', hargaSatuan: 0, total: 0 };
    onChange({ ...data, items: [...(data.items || []), newItem] });
  };

  const removeItem = (index: number) => {
    const newItems = [...(data.items || [])];
    newItems.splice(index, 1);
    onChange({ ...data, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(data.items || [])];
    let finalValue = value;

    if (field === 'deskripsi') {
      finalValue = toSentenceCase(value);
    } else if (field === 'satuan') {
      finalValue = toTitleCase(value);
    }

    const item = { ...newItems[index], [field]: finalValue };
    
    // Auto calculate total
    if (field === 'kuantitas' || field === 'hargaSatuan') {
      item.total = Number(item.kuantitas) * Number(item.hargaSatuan);
    }
    
    newItems[index] = item;
    onChange({ ...data, items: newItems });
  };

  const addHeir = () => {
    const newHeir: Heir = { nama: '', nik: '', hubungan: '' };
    onChange({ ...data, ahliWaris: [...data.ahliWaris, newHeir] });
  };

  const removeHeir = (index: number) => {
    const newHeirs = [...data.ahliWaris];
    newHeirs.splice(index, 1);
    onChange({ ...data, ahliWaris: newHeirs });
  };

  const handleHeirChange = (index: number, field: keyof Heir, value: string) => {
    const newHeirs = [...data.ahliWaris];
    let finalValue = value;

    if (field === 'nama') {
      finalValue = toTitleCase(value);
    } else if (field === 'hubungan') {
      finalValue = toSentenceCase(value);
    }

    newHeirs[index] = { ...newHeirs[index], [field]: finalValue };
    onChange({ ...data, ahliWaris: newHeirs });
  };

  const addWitness = () => {
    const newWitness: Witness = { nama: '', jabatan: '' };
    onChange({ ...data, saksi: [...data.saksi, newWitness] });
  };

  const removeWitness = (index: number) => {
    const newWitnesses = [...data.saksi];
    newWitnesses.splice(index, 1);
    onChange({ ...data, saksi: newWitnesses });
  };

  const handleWitnessChange = (index: number, field: keyof Witness, value: string) => {
    const newWitnesses = [...data.saksi];
    let finalValue = value;

    if (field === 'nama' || field === 'jabatan') {
      finalValue = toTitleCase(value);
    }

    newWitnesses[index] = { ...newWitnesses[index], [field]: finalValue };
    onChange({ ...data, saksi: newWitnesses });
  };

  // AI Generation Handler
  const handleAIGeneration = (result: GeneratedLetter) => {
    // If CV or Job App, and current keperluan is empty, fill it with the selected narrative
    const isCvOrJobApp = result.type === 'cv' || result.type === 'job_app';
    const finalKeperluan = (isCvOrJobApp && !data.keperluan) ? result.narasiSurat : (result.keperluan || data.keperluan);

    onChange({ 
      ...data, 
      type: result.type,
      judulSurat: result.judulSurat, 
      keperluan: finalKeperluan, 
      narasiSurat: result.narasiSurat,
      nama: result.nama || data.nama,
      nik: result.nik || data.nik,
      tempatLahir: result.tempatLahir || data.tempatLahir,
      tanggalLahir: result.tanggalLahir || data.tanggalLahir,
      detailObjek: result.detailObjek || data.detailObjek,
      penerima: result.penerima || data.penerima,
      lampiran: result.lampiran || data.lampiran,
      tembusan: result.tembusan || data.tembusan,
      memo: result.memo || data.memo,
      email: result.email || data.email,
      telepon: result.telepon || data.telepon,
      linkedin: result.linkedin || data.linkedin,
      portofolio: result.portofolio || data.portofolio,
      pendidikan: result.pendidikan || data.pendidikan,
      pengalaman: result.pengalaman || data.pengalaman,
      keahlian: result.keahlian || data.keahlian,
      perusahaanTujuan: result.perusahaanTujuan || data.perusahaanTujuan,
      posisiTujuan: result.posisiTujuan || data.posisiTujuan,
      hargaJualBeli: formatRupiah(result.hargaJualBeli || data.hargaJualBeli),
    });
    
    // Automatically switch to Profil (penduduk) as requested
    setActiveSection('penduduk');
    const element = document.getElementById('form-top');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

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
          onChange({
            ...data,
            nama: toTitleCase(result.nama || ''),
            nik: result.nik || '',
            tempatLahir: toTitleCase(result.tempatLahir || ''),
            tanggalLahir: result.tanggalLahir || '',
            jenisKelamin: result.jenisKelamin || data.jenisKelamin,
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
      setScanError("Gagal membaca file");
      setIsScanning(false);
    }
  };

  const inputStyle = "w-full py-2.5 bg-paper/50 border border-line rounded-lg px-4 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none font-sans text-sm transition-all placeholder:text-ink/20";
  const labelStyle = "block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1 font-heading";

  const sections = [
    { id: 'umum', label: 'Dasar', icon: LayoutDashboard },
    { id: 'penduduk', label: 'Profil', icon: User, types: ['admin', 'cv', 'job_app', 'agreement'] },
    { id: 'kontak', label: 'Kontak', icon: Mail, types: ['cv', 'job_app', 'business'] },
    { id: 'jual_beli', label: 'Objek', icon: Landmark, types: ['admin', 'agreement'] },
    { id: 'rincian', label: 'Rincian', icon: Receipt, types: ['business'] },
    { id: 'riwayat', label: 'Karir & Edu', icon: GraduationCap, types: ['cv'] },
    { id: 'waris_saksi', label: 'Pihak & Saksi', icon: Users, types: ['admin', 'agreement'] },
    { id: 'isi', label: 'Isi & TTD', icon: FileText, types: ['admin', 'cv', 'job_app', 'business', 'agreement'] },
  ].filter(s => !s.types || s.types.includes(data.type)) as any;

  const handleNext = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id as FormSection);
      const element = document.getElementById('form-top');
      element?.scrollIntoView({ behavior: 'smooth' });
    } else if (onFinish) {
      onFinish();
    }
  };

  const handlePrev = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id as FormSection);
      const element = document.getElementById('form-top');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavigationFooter = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    const isLast = currentIndex === sections.length - 1;
    const isFirst = currentIndex === 0;

    return (
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-10 pb-6 mt-6 border-t border-line/30">
        {!isFirst ? (
          <button
            onClick={handlePrev}
            className="w-full sm:flex-1 py-4.5 bg-white border border-line text-ink/60 rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:bg-ink hover:text-white active:scale-95 transition-all flex items-center justify-center gap-3 group shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
        ) : (
          <div className="hidden sm:block sm:flex-1" />
        )}
        
        <button
          onClick={handleNext}
          className="w-full sm:flex-[2] py-4.5 bg-accent text-paper rounded-2xl font-black text-[10px] uppercase tracking-[3px] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center gap-2">
            {isLast ? 'SELESAI & PREVIEW' : 'SELANJUTNYA'}
            {!isLast && <span className="opacity-40 font-bold">({sections[currentIndex + 1].label})</span>}
          </span>
          {!isLast && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />}
          {isLast && <FileText className="w-4 h-4 group-hover:scale-110 transition-transform relative z-10" />}
        </button>
      </div>
    );
  };

  return (
    <div id="form-top" className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumbs / Steps Indicator */}
      <div className="flex-shrink-0 mb-4 sm:mb-8 mt-1 sm:mt-2 overflow-x-auto no-scrollbar pb-2 px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex items-center min-w-max gap-3 sm:gap-4">
          {sections.map((s, i) => {
            const isActive = s.id === activeSection;
            const currentIndex = sections.findIndex(sec => sec.id === activeSection);
            const isPast = i < currentIndex;
            
            return (
              <React.Fragment key={s.id}>
                <button 
                  onClick={() => setActiveSection(s.id as FormSection)}
                  className={`flex items-center gap-2 sm:gap-3 group text-left transition-all ${isActive ? 'scale-105' : ''}`}
                >
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 transition-all duration-500 flex-shrink-0
                    ${isActive ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 
                      isPast ? 'bg-accent/10 border-accent/20 text-accent' : 
                      'bg-paper border-line text-ink/20'}
                  `}>
                    <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-ink' : isPast ? 'text-ink/60' : 'text-ink/20'}`}>
                      {s.label}
                    </span>
                    {isActive && <motion.span layoutId="active-dot" className="w-2.5 sm:w-3 h-[2px] bg-accent mt-1" />}
                  </div>
                </button>
                {i < sections.length - 1 && (
                  <div className={`w-2 sm:w-4 h-[1px] ${i < currentIndex ? 'bg-accent/30' : 'bg-line'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto pr-1 md:pr-2 no-scrollbar pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {activeSection === 'umum' && (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <AIAssistant onGenerated={handleAIGeneration} currentType={data.type} />

                <div className="p-4 sm:p-5 bg-accent/5 rounded-2xl border border-accent/10 space-y-4 sm:space-y-6">
                  <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Konfigurasi Utama
                  </h3>

                  <div className="col-span-full">
                    <label className={labelStyle}>Tipe Dokumen</label>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                      <button
                        onClick={() => onChange({ ...INITIAL_DATA, type: 'admin', id: data.id })}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-w-0 flex flex-col justify-between ${data.type === 'admin' ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-line hover:border-accent/40'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 min-w-0">
                          <Landmark className={`flex-shrink-0 w-3 h-3 ${data.type === 'admin' ? 'text-accent' : 'text-ink/40'}`} />
                          <span className={`text-[9px] font-black tracking-widest uppercase truncate ${data.type === 'admin' ? 'text-accent' : 'text-ink'}`}>Desa</span>
                        </div>
                        <p className="text-[8px] text-ink/40 leading-tight break-words">Administrasi.</p>
                      </button>
                      <button
                        onClick={() => onChange({ ...INITIAL_DATA, type: 'cv', id: data.id, paperSize: 'a4', judulSurat: 'CURRICULUM VITAE' })}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-w-0 flex flex-col justify-between ${data.type === 'cv' ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-line hover:border-accent/40'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 min-w-0">
                          <GraduationCap className={`flex-shrink-0 w-3 h-3 ${data.type === 'cv' ? 'text-accent' : 'text-ink/40'}`} />
                          <span className={`text-[9px] font-black tracking-widest uppercase truncate ${data.type === 'cv' ? 'text-accent' : 'text-ink'}`}>CV</span>
                        </div>
                        <p className="text-[8px] text-ink/40 leading-tight break-words">Karir.</p>
                      </button>
                      <button
                        onClick={() => onChange({ ...INITIAL_DATA, type: 'job_app', id: data.id, paperSize: 'a4', judulSurat: 'Surat Lamaran Kerja' })}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-w-0 flex flex-col justify-between ${data.type === 'job_app' ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-line hover:border-accent/40'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 min-w-0">
                          <Mail className={`flex-shrink-0 w-3 h-3 ${data.type === 'job_app' ? 'text-accent' : 'text-ink/40'}`} />
                          <span className={`text-[9px] font-black tracking-widest uppercase truncate ${data.type === 'job_app' ? 'text-accent' : 'text-ink'}`}>Lamaran</span>
                        </div>
                        <p className="text-[8px] text-ink/40 leading-tight break-words">Kerja.</p>
                      </button>
                      <button
                        onClick={() => onChange({ ...INITIAL_DATA, type: 'business', id: data.id, paperSize: 'a4', judulSurat: 'INVOICE / TAGIHAN' })}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-w-0 flex flex-col justify-between ${data.type === 'business' ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-line hover:border-accent/40'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 min-w-0">
                          <Receipt className={`flex-shrink-0 w-3 h-3 ${data.type === 'business' ? 'text-accent' : 'text-ink/40'}`} />
                          <span className={`text-[9px] font-black tracking-widest uppercase truncate ${data.type === 'business' ? 'text-accent' : 'text-ink'}`}>Bisnis</span>
                        </div>
                        <p className="text-[8px] text-ink/40 leading-tight break-words">Invoice.</p>
                      </button>
                      <button
                        onClick={() => onChange({ ...INITIAL_DATA, type: 'agreement', id: data.id, paperSize: 'legal', judulSurat: 'SURAT PERJANJIAN' })}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all min-w-0 flex flex-col justify-between ${data.type === 'agreement' ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-line hover:border-accent/40'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 min-w-0">
                          <Handshake className={`flex-shrink-0 w-3 h-3 ${data.type === 'agreement' ? 'text-accent' : 'text-ink/40'}`} />
                          <span className={`text-[9px] font-black tracking-widest uppercase truncate ${data.type === 'agreement' ? 'text-accent' : 'text-ink'}`}>Legal</span>
                        </div>
                        <p className="text-[8px] text-ink/40 leading-tight break-words">Kontrak.</p>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Ukuran Kertas</label>
                    <select
                      name="paperSize"
                      value={data.paperSize}
                      onChange={handleChange}
                      className={inputStyle}
                    >
                      <option value="a4">A4 (210 x 297 mm)</option>
                      <option value="legal">Legal (216 x 356 mm)</option>
                      <option value="letter">Letter (216 x 279 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Judul Dokumen</label>
                    <input
                      type="text"
                      name="judulSurat"
                      value={data.judulSurat}
                      onChange={handleChange}
                      placeholder="Contoh: Surat Pengantar Desa"
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Nomor Surat (Hanya Desa)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="nomorSurat"
                        value={data.nomorSurat}
                        onChange={handleChange}
                        className={inputStyle}
                      />
                      <button
                        onClick={onRefreshNumber}
                        className="p-2.5 bg-white border border-line rounded-lg text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Tanggal Dokumen</label>
                    <input
                      type="date"
                      name="tanggalSurat"
                      value={data.tanggalSurat}
                      onChange={handleChange}
                      className={inputStyle}
                    />
                  </div>
                </div>

                {data.type === 'admin' && (
                  <>
                    <div className="p-5 bg-paper border border-line rounded-2xl space-y-6">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Identitas Instansi
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelStyle}>Kabupaten</label>
                          <input type="text" name="kabupaten" value={data.kabupaten} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                          <label className={labelStyle}>Kecamatan</label>
                          <input type="text" name="kecamatan" value={data.kecamatan} onChange={handleChange} className={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label className={labelStyle}>Nama Desa</label>
                        <input type="text" name="desa" value={data.desa} onChange={handleChange} className={inputStyle} />
                      </div>
                      <div>
                        <label className={labelStyle}>Alamat Kantor</label>
                        <input type="text" name="alamatDesa" value={data.alamatDesa} onChange={handleChange} className={inputStyle} />
                      </div>
                    </div>

                    <div className="p-5 bg-paper border border-line rounded-2xl space-y-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Logo Kabupaten
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-bg rounded-xl border border-line flex items-center justify-center overflow-hidden relative group">
                          {data.logoKabupaten ? (
                            <>
                              <img 
                                src={data.logoKabupaten} 
                                alt="Logo" 
                                className="w-full h-full object-contain p-2"
                                referrerPolicy="no-referrer"
                              />
                              <button 
                                onClick={removeLogo}
                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="w-8 h-8 text-ink/10" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="flex flex-col items-center justify-center w-full py-4 bg-white border border-dashed border-line rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="w-5 h-5 text-accent mb-1" />
                              <p className="text-[10px] font-bold text-ink/60 uppercase tracking-widest leading-none">Upload Logo</p>
                              <p className="text-[8px] text-ink/20 mt-1 uppercase">Maks 2MB (PNG/JPG)</p>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === 'kontak' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 bg-paper border border-line rounded-2xl space-y-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Informasi Kontak
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Email</label>
                      <input type="email" name="email" value={data.email || ''} onChange={handleChange} className={inputStyle} placeholder="example@mail.com" />
                    </div>
                    <div>
                      <label className={labelStyle}>Telepon</label>
                      <input type="text" name="telepon" value={data.telepon || ''} onChange={handleChange} className={inputStyle} placeholder="0812..." />
                    </div>
                    <div>
                      <label className={labelStyle}>LinkedIn</label>
                      <input type="text" name="linkedin" value={data.linkedin || ''} onChange={handleChange} className={inputStyle} placeholder="linkedin.com/in/..." />
                    </div>
                    <div>
                      <label className={labelStyle}>Portfolio / Web</label>
                      <input type="text" name="portofolio" value={data.portofolio || ''} onChange={handleChange} className={inputStyle} placeholder="github.com/..." />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'rincian' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <Receipt className="w-4 h-4" /> Daftar Item / Rincian
                    </h3>
                    <button onClick={addItem} className="text-[9px] font-black text-accent flex items-center gap-2 px-3 py-1.5 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
                      <Plus className="w-3 h-3" /> TAMBAH ITEM
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(data.items || []).map((item, idx) => (
                      <div key={idx} className="p-6 bg-paper border border-line rounded-2xl relative group hover:border-accent/40 transition-all">
                        <button onClick={() => removeItem(idx)} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-4">
                          <div>
                            <label className={labelStyle}>Deskripsi Item</label>
                            <input 
                              type="text" 
                              value={item.deskripsi} 
                              onChange={(e) => handleItemChange(idx, 'deskripsi', e.target.value)} 
                              className={inputStyle} 
                              placeholder="Contoh: Jasa Pembuatan Website"
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="col-span-1">
                              <label className={labelStyle}>Kuantitas</label>
                              <input 
                                type="number" 
                                value={item.kuantitas} 
                                onChange={(e) => handleItemChange(idx, 'kuantitas', Number(e.target.value))} 
                                className={inputStyle} 
                              />
                            </div>
                            <div className="col-span-1">
                              <label className={labelStyle}>Satuan</label>
                              <input 
                                type="text" 
                                value={item.satuan} 
                                onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)} 
                                className={inputStyle} 
                                placeholder="Bulan/Pcs"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className={labelStyle}>Harga Satuan</label>
                              <input 
                                type="number" 
                                value={item.hargaSatuan} 
                                onChange={(e) => handleItemChange(idx, 'hargaSatuan', Number(e.target.value))} 
                                className={inputStyle} 
                              />
                            </div>
                          </div>
                          <div className="pt-2 flex justify-end">
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest mb-1">Total</p>
                              <p className="text-sm font-black text-ink">{formatRupiah(item.total)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(data.items || []).length === 0 && (
                      <div className="text-center py-12 bg-paper border border-dashed border-line rounded-3xl text-[10px] uppercase tracking-widest text-ink/20">
                        Belum ada rincian item.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'riwayat' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Pendidikan */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Riwayat Pendidikan
                    </h3>
                    <button onClick={() => onChange({ ...data, pendidikan: [...(data.pendidikan || []), { sekolah: '', periode: '', jurusan: '', deskripsi: '' }] })} className="text-[9px] font-black text-accent flex items-center gap-2 px-3 py-1.5 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
                      <Plus className="w-3 h-3" /> TAMBAH
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {(data.pendidikan || []).map((edu, idx) => (
                      <div key={idx} className="p-5 bg-paper border border-line rounded-2xl relative group">
                        <button onClick={() => {
                          const newEdu = [...(data.pendidikan || [])];
                          newEdu.splice(idx, 1);
                          onChange({ ...data, pendidikan: newEdu });
                        }} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-full">
                            <label className={labelStyle}>Nama Sekolah / Univ</label>
                            <input type="text" value={edu.sekolah} onChange={(e) => {
                              const newEdu = [...(data.pendidikan || [])];
                              newEdu[idx] = { ...newEdu[idx], sekolah: e.target.value };
                              onChange({ ...data, pendidikan: newEdu });
                            }} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Periode</label>
                            <input type="text" value={edu.periode} onChange={(e) => {
                              const newEdu = [...(data.pendidikan || [])];
                              newEdu[idx] = { ...newEdu[idx], periode: e.target.value };
                              onChange({ ...data, pendidikan: newEdu });
                            }} className={inputStyle} placeholder="2018 - 2022" />
                          </div>
                          <div>
                            <label className={labelStyle}>Jurusan/Gelar</label>
                            <input type="text" value={edu.jurusan} onChange={(e) => {
                              const newEdu = [...(data.pendidikan || [])];
                              newEdu[idx] = { ...newEdu[idx], jurusan: e.target.value };
                              onChange({ ...data, pendidikan: newEdu });
                            }} className={inputStyle} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pengalaman */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Pengalaman Kerja
                    </h3>
                    <button onClick={() => onChange({ ...data, pengalaman: [...(data.pengalaman || []), { perusahaan: '', periode: '', posisi: '', deskripsi: '' }] })} className="text-[9px] font-black text-accent flex items-center gap-2 px-3 py-1.5 bg-accent/5 rounded-full hover:bg-accent/10 transition-colors">
                      <Plus className="w-3 h-3" /> TAMBAH
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {(data.pengalaman || []).map((exp, idx) => (
                      <div key={idx} className="p-5 bg-paper border border-line rounded-2xl relative group">
                        <button onClick={() => {
                          const newExp = [...(data.pengalaman || [])];
                          newExp.splice(idx, 1);
                          onChange({ ...data, pengalaman: newExp });
                        }} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-full">
                            <label className={labelStyle}>Perusahaan / Organisasi</label>
                            <input type="text" value={exp.perusahaan} onChange={(e) => {
                              const newExp = [...(data.pengalaman || [])];
                              newExp[idx] = { ...newExp[idx], perusahaan: e.target.value };
                              onChange({ ...data, pengalaman: newExp });
                            }} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Periode</label>
                            <input type="text" value={exp.periode} onChange={(e) => {
                              const newExp = [...(data.pengalaman || [])];
                              newExp[idx] = { ...newExp[idx], periode: e.target.value };
                              onChange({ ...data, pengalaman: newExp });
                            }} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Posisi / Jabatan</label>
                            <input type="text" value={exp.posisi} onChange={(e) => {
                              const newExp = [...(data.pengalaman || [])];
                              newExp[idx] = { ...newExp[idx], posisi: e.target.value };
                              onChange({ ...data, pengalaman: newExp });
                            }} className={inputStyle} />
                          </div>
                          <div className="col-span-full">
                            <label className={labelStyle}>Deskripsi Pekerjaan</label>
                            <textarea value={exp.deskripsi} onChange={(e) => {
                              const newExp = [...(data.pengalaman || [])];
                              newExp[idx] = { ...newExp[idx], deskripsi: e.target.value };
                              onChange({ ...data, pengalaman: newExp });
                            }} className={`${inputStyle} h-20 resize-none`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'penduduk' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 bg-paper border border-line rounded-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <User className="w-4 h-4" /> Data Personal Profil
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          capture="environment"
                          onChange={handleScanKtp}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          disabled={isScanning}
                        />
                        <button 
                          className={`text-[9px] font-black uppercase tracking-[2px] px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm border ${
                            isScanning ? 'bg-bg text-ink/20 border-line' : 'bg-white text-accent border-accent/20 hover:bg-accent/5'
                          }`}
                        >
                          {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                          {isScanning ? 'MEMPROSES...' : 'SCAN KTP'}
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          onChange({
                            ...data,
                            nama: '',
                            nik: '',
                            tempatLahir: '',
                            tanggalLahir: '',
                            pekerjaan: '',
                            alamat: ''
                          });
                        }}
                        className={`text-[9px] font-black uppercase tracking-[2px] px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm border ${
                          (!data.nama && !data.nik) 
                          ? 'bg-accent text-white border-accent' 
                          : 'bg-paper text-ink/40 border-line hover:border-accent hover:text-accent'
                        }`}
                        title="Kosongkan data untuk surat instansi/lembaga"
                      >
                        <Landmark className="w-3.5 h-3.5" /> MODE INSTITUSI
                      </button>
                      <button 
                        onClick={() => {
                          const profile = getRandomProfile();
                          onChange({
                            ...data,
                            ...profile
                          });
                        }}
                        className="text-[9px] font-black text-accent uppercase tracking-[2px] px-4 py-2 bg-accent/10 border border-accent/10 rounded-xl hover:bg-accent hover:text-white active:scale-95 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> CONTOH PERSONAL
                      </button>
                    </div>
                  </div>

                  {scanError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest text-center">{scanError}</p>
                    </div>
                  )}

                  {(!data.nama && !data.nik) && (
                    <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-1">Mode Institusi Aktif</p>
                        <p className="text-[9px] text-ink/40 font-medium leading-relaxed">Kolom identitas pribadi kosong. Surat akan ditampilkan sebagai dokumen lembaga/pemerintah tanpa rincian NIK personal.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelStyle}>Nama Lengkap</label>
                    <input 
                      type="text" 
                      name="nama" 
                      placeholder="Masukkan nama sesuai KTP"
                      value={data.nama} 
                      onChange={handleChange} 
                      className={`${inputStyle} font-bold text-ink uppercase tracking-wide placeholder:font-normal placeholder:lowercase placeholder:tracking-normal placeholder:opacity-30`} 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>NIK</label>
                    <input 
                      type="text" 
                      name="nik" 
                      placeholder="Contoh: 3507123456780001"
                      value={data.nik} 
                      onChange={handleChange} 
                      className={inputStyle} 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Tempat Lahir</label>
                      <input 
                        type="text" 
                        name="tempatLahir" 
                        placeholder="Contoh: Malang atau Jakarta"
                        value={data.tempatLahir} 
                        onChange={handleChange} 
                        className={inputStyle} 
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Tanggal Lahir</label>
                      <input type="date" name="tanggalLahir" value={data.tanggalLahir} onChange={handleChange} className={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Jenis Kelamin</label>
                      <select name="jenisKelamin" value={data.jenisKelamin} onChange={handleChange} className={inputStyle}>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Pekerjaan saat ini</label>
                      <input 
                        type="text" 
                        name="pekerjaan" 
                        placeholder="Contoh: Karyawan Swasta, Petani, atau Pelajar"
                        value={data.pekerjaan} 
                        onChange={handleChange} 
                        className={inputStyle} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Alamat Lengkap</label>
                    <textarea 
                      name="alamat" 
                      placeholder="Contoh: Jl. Diponegoro No. 12, RT 01 RW 02, Dusun Krajan"
                      value={data.alamat} 
                      onChange={handleChange} 
                      className={`${inputStyle} h-24 resize-none`} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'jual_beli' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 bg-paper/30 border border-line border-dashed rounded-2xl flex items-center gap-3 text-ink/40 mb-2">
                  <Landmark className="w-5 h-5" />
                  <p className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">Data Tambahan / Detail Objek (Kelahiran, Jual Beli, dll)</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Harga / Nilai (Jika Ada)</label>
                    <input 
                      type="text" 
                      name="hargaJualBeli" 
                      value={data.hargaJualBeli || ''} 
                      onChange={handleChange} 
                      className={inputStyle} 
                      placeholder="Contoh: 150.000.000"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Detail Informasi Tambahan</label>
                    <textarea 
                      name="detailObjek" 
                      value={data.detailObjek || ''} 
                      onChange={handleChange} 
                      className={`${inputStyle} h-40 resize-none`}
                      placeholder="Masukkan detail khusus (Contoh: Data kelahiran anak, detail tanah, atau keterangan tambahan lainnya)"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'waris_saksi' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Ahli Waris */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Daftar Pihak
                    </h3>
                    <button onClick={addHeir} className="text-[9px] font-black uppercase tracking-[2px] px-4 py-1.5 bg-ink text-paper rounded-xl hover:bg-accent hover:shadow-lg hover:shadow-accent/20 active:scale-95 transition-all flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5" /> TAMBAH
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.ahliWaris.map((heir, idx) => (
                      <div key={idx} className="p-5 bg-paper border border-line rounded-2xl relative group hover:border-accent/40 transition-all">
                        <button onClick={() => removeHeir(idx)} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-4">
                          <div>
                            <label className={labelStyle}>Pihak {idx + 1}</label>
                            <input type="text" value={heir.nama} onChange={(e) => handleHeirChange(idx, 'nama', e.target.value)} className={inputStyle} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="col-span-1">
                              <label className={labelStyle}>Peran</label>
                              <input 
                                type="text" 
                                placeholder="Penjual/Pembeli"
                                value={heir.peran || ''} 
                                onChange={(e) => handleHeirChange(idx, 'peran', e.target.value)} 
                                className={inputStyle} 
                              />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                              <label className={labelStyle}>NIK</label>
                              <input type="text" value={heir.nik} onChange={(e) => handleHeirChange(idx, 'nik', e.target.value)} className={inputStyle} />
                            </div>
                          </div>
                          <div>
                            <label className={labelStyle}>Hubungan / Keterangan</label>
                            <input type="text" value={heir.hubungan} onChange={(e) => handleHeirChange(idx, 'hubungan', e.target.value)} className={inputStyle} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.ahliWaris.length === 0 && <div className="text-center py-8 bg-paper border border-dashed border-line rounded-2xl text-[10px] uppercase tracking-widest text-ink/20">Belum ada data</div>}
                  </div>
                </div>

                {/* Saksi-Saksi */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Saksi-Saksi
                    </h3>
                    <button onClick={addWitness} className="text-[9px] font-black uppercase tracking-[2px] px-4 py-1.5 bg-ink text-paper rounded-xl hover:bg-accent hover:shadow-lg hover:shadow-accent/20 active:scale-95 transition-all flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5" /> TAMBAH
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.saksi.map(( witness, idx) => (
                      <div key={idx} className="p-5 bg-paper border border-line rounded-2xl relative group hover:border-accent/40 transition-all">
                        <button onClick={() => removeWitness(idx)} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-4">
                          <div>
                            <label className={labelStyle}>Nama Saksi #{idx + 1}</label>
                            <input type="text" value={ witness.nama} onChange={(e) => handleWitnessChange(idx, 'nama', e.target.value)} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Jabatan / Peran</label>
                            <input type="text" value={ witness.jabatan} onChange={(e) => handleWitnessChange(idx, 'jabatan', e.target.value)} className={inputStyle} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {data.saksi.length === 0 && <div className="text-center py-8 bg-paper border border-dashed border-line rounded-2xl text-[10px] uppercase tracking-widest text-ink/20">Belum ada data</div>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'isi' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 bg-paper border border-line rounded-2xl space-y-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Redaksi & Pengesahan
                  </h3>
                  {data.type === 'admin' && (
                    <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-3">
                      <div className="p-1 bg-blue-500 text-white rounded-md mt-0.5">
                        <FileText className="w-3 h-3" />
                      </div>
                      <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                        <span className="font-bold">Info Tata Letak:</span> Jika <span className="underline italic">Lampiran</span> diisi, judul surat yang biasanya di tengah akan berpindah ke sisi kiri mengikuti standar tata naskah dinas resmi.
                      </p>
                    </div>
                  )}

                  {(data.type === 'job_app' || data.type === 'admin') && (
                    <div className="grid grid-cols-2 gap-4">
                      {data.type === 'job_app' ? (
                        <>
                          <div className="col-span-full">
                            <label className={labelStyle}>Perusahaan Tujuan</label>
                            <input type="text" name="perusahaanTujuan" value={data.perusahaanTujuan || ''} onChange={handleChange} className={inputStyle} placeholder="Contoh: PT. Maju Jaya" />
                          </div>
                          <div className="col-span-full">
                            <label className={labelStyle}>Posisi Tujuan</label>
                            <input type="text" name="posisiTujuan" value={data.posisiTujuan || ''} onChange={handleChange} className={inputStyle} placeholder="Contoh: Senior Developer" />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className={labelStyle}>Lampiran</label>
                          <input type="text" name="lampiran" value={data.lampiran || ''} onChange={handleChange} className={inputStyle} placeholder="Contoh: 1 (satu) Berkas" />
                          <p className="mt-1 text-[10px] text-ink/40 italic font-medium leading-tight">
                            *Jika diisi, tata letak judul surat akan berpindah ke sisi kiri (format surat dinas).
                          </p>
                        </div>
                      )}
                      
                      <div className={data.type === 'job_app' ? 'col-span-full' : ''}>
                        <label className={labelStyle}>{data.type === 'job_app' ? 'Pihak Penerima (Yth.)' : 'Penerima (Kepada Yth)'}</label>
                        <textarea name="penerima" value={data.penerima || ''} onChange={handleChange} className={`${inputStyle} h-10 resize-none`} placeholder="Contoh: Manajer HRD" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelStyle}>{data.type === 'cv' ? 'Variasi Narasi Profil' : data.type === 'job_app' ? 'Isi Surat Lamaran' : 'Paragraf Narasi'}</label>
                    <textarea name="narasiSurat" value={data.narasiSurat} onChange={handleChange} className={`${inputStyle} ${data.type === 'cv' ? 'h-32' : 'h-60'} resize-none leading-relaxed`} />
                  </div>

                  {data.type === 'cv' && (
                    <div>
                      <label className={labelStyle}>Keahlian (Pisahkan dengan koma)</label>
                      <textarea 
                        name="keahlian" 
                        value={data.keahlian?.join(', ') || ''} 
                        onChange={(e) => {
                          const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          onChange({ ...data, keahlian: skills });
                        }} 
                        className={`${inputStyle} h-20 resize-none leading-relaxed`} 
                        placeholder="Contoh: React.js, TypeScript, Adobe XD"
                      />
                    </div>
                  )}

                  {(data.type === 'admin' || data.type === 'cv' || data.type === 'job_app') && (
                    <>
                      <div>
                        <label className={labelStyle}>
                          {data.type === 'cv' ? 'Objective / Summary' : data.type === 'job_app' ? 'Ringkasan / Catatan' : 'Untuk Keperluan'}
                        </label>
                        <textarea 
                          name="keperluan" 
                          value={data.keperluan} 
                          onChange={handleChange} 
                          className={`${inputStyle} h-20 resize-none`} 
                          placeholder={
                            data.type === 'cv' ? 'Tuliskan objektif karir atau ringkasan profesional Anda...' : 
                            data.type === 'job_app' ? 'Ringkasan singkat atau catatan tambahan...' :
                            'Contoh: Persyaratan melamar beasiswa'
                          }
                        />
                      </div>

                      <div>
                        <label className={labelStyle}>Tembusan (Opsional)</label>
                        <textarea name="tembusan" value={data.tembusan || ''} onChange={handleChange} className={`${inputStyle} h-20 resize-none`} placeholder="Pihak yang mendapatkan salinan surat..." />
                      </div>
                    </>
                  )}

                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Memo / Ringkasan AI</span>
                    </div>
                    <textarea 
                      name="memo" 
                      value={data.memo || ''} 
                      onChange={handleChange} 
                      className={`${inputStyle} bg-white h-20 resize-none border-accent/20 focus:border-accent text-accent font-medium leading-relaxed`} 
                      placeholder="Ringkasan singkat isi surat untuk memudahkan pencarian..." 
                    />
                    <p className="text-[8px] text-accent/60 uppercase font-bold tracking-tight">Catatan ini hanya untuk mempermudah ringkasan cepat dan tidak akan ikut dicetak/disimpan dalam file utama.</p>
                  </div>

                  <div className="pt-4 border-t border-line space-y-4">
                    <div className="flex items-center gap-2 text-ink/40 mb-2">
                      <Signature className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Penanggung Jawab</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelStyle}>Nama Penandatangan</label>
                        <input type="text" name="namaKades" value={data.namaKades} onChange={handleChange} className={inputStyle} />
                      </div>
                      <div>
                        <label className={labelStyle}>Jabatan</label>
                        <input type="text" name="jabatanKades" value={data.jabatanKades} onChange={handleChange} className={inputStyle} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <NavigationFooter />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

