import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { LetterData, Heir, Witness, INITIAL_DATA } from '../types';
import { 
  RefreshCw, User, FileText, Briefcase, Users, Plus, Trash2, GraduationCap,
  ShieldCheck, LayoutDashboard, Database, Signature, Settings2, Sparkles, Upload, Landmark, Image as ImageIcon,
  Mail, Phone, Award, ChevronDown, MapPin
} from 'lucide-react';
import { AIAssistant } from './AIAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { GeneratedLetter } from '../services/geminiService';
import { Education, Experience, Skill } from '../types';
import { formatRupiah } from '../lib/utils';

interface Props {
  data: LetterData;
  onChange: (data: LetterData) => void;
  onRefreshNumber: () => void;
}

export type FormSection = 'umum' | 'penduduk' | 'waris_saksi' | 'isi' | 'jual_beli' | 'cv_detail';

export interface LetterFormHandle {
  setSection: (section: FormSection) => void;
}

export const LetterForm = forwardRef<LetterFormHandle, Props>(({ data, onChange, onRefreshNumber }, ref) => {
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
    if (name === 'hargaJualBeli') {
      onChange({ ...data, [name]: formatRupiah(value) });
    } else {
      onChange({ ...data, [name]: value });
    }
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
    newHeirs[index] = { ...newHeirs[index], [field]: value };
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
    newWitnesses[index] = { ...newWitnesses[index], [field]: value };
    onChange({ ...data, saksi: newWitnesses });
  };

  // CV Handlers
  const addEducation = () => {
    const newItem: Education = { institusi: '', gelar: '', tahun: '' };
    onChange({ ...data, pendidikan: [...data.pendidikan, newItem] });
  };

  const removeEducation = (index: number) => {
    const newList = [...data.pendidikan];
    newList.splice(index, 1);
    onChange({ ...data, pendidikan: newList });
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    const newList = [...data.pendidikan];
    newList[index] = { ...newList[index], [field]: value };
    onChange({ ...data, pendidikan: newList });
  };

  const addExperience = () => {
    const newItem: Experience = { perusahaan: '', posisi: '', durasi: '', deskripsi: '' };
    onChange({ ...data, pengalaman: [...data.pengalaman, newItem] });
  };

  const removeExperience = (index: number) => {
    const newList = [...data.pengalaman];
    newList.splice(index, 1);
    onChange({ ...data, pengalaman: newList });
  };

  const handleExperienceChange = (index: number, field: keyof Experience, value: string) => {
    const newList = [...data.pengalaman];
    newList[index] = { ...newList[index], [field]: value };
    onChange({ ...data, pengalaman: newList });
  };

  const addSkill = () => {
    const newItem: Skill = { nama: '', level: 'Menengah' };
    onChange({ ...data, keahlian: [...data.keahlian, newItem] });
  };

  const removeSkill = (index: number) => {
    const newList = [...data.keahlian];
    newList.splice(index, 1);
    onChange({ ...data, keahlian: newList });
  };

  const handleSkillChange = (index: number, field: keyof Skill, value: string) => {
    const newList = [...data.keahlian];
    newList[index] = { ...newList[index], [field]: value };
    onChange({ ...data, keahlian: newList });
  };

  const handleAIGeneration = (result: GeneratedLetter) => {
    onChange({ 
      ...data, 
      type: result.type,
      judulSurat: result.judulSurat, 
      keperluan: result.keperluan, 
      narasiSurat: result.narasiSurat,
      nama: result.nama || data.nama,
      nik: result.nik || data.nik,
      email: result.email || data.email,
      telepon: result.telepon || data.telepon,
      tempatLahir: result.tempatLahir || data.tempatLahir,
      tanggalLahir: result.tanggalLahir || data.tanggalLahir,
      detailObjek: result.detailObjek || data.detailObjek,
      hargaJualBeli: formatRupiah(result.hargaJualBeli || data.hargaJualBeli),
      perusahaanTujuan: result.perusahaanTujuan || data.perusahaanTujuan,
      posisiDilamar: result.posisiDilamar || data.posisiDilamar,
      tujuanPerjalanan: result.tujuanPerjalanan || data.tujuanPerjalanan,
      tanggalBerangkat: result.tanggalBerangkat || data.tanggalBerangkat,
      tanggalKembali: result.tanggalKembali || data.tanggalKembali,
      kendaraan: result.kendaraan || data.kendaraan,
      bebanAnggaran: result.bebanAnggaran || data.bebanAnggaran,
      pendidikan: result.pendidikan || data.pendidikan,
      pengalaman: result.pengalaman || data.pengalaman,
      keahlian: result.keahlian || data.keahlian,
    });
    // Intelligently switch section based on content keywords
    const content = (result.judulSurat + ' ' + result.keperluan + ' ' + result.narasiSurat).toLowerCase();
    
    if (result.type === 'cv') {
      setActiveSection('cv_detail');
    } else if (result.type === 'sppd') {
      setActiveSection('sppd_detail');
    } else if (result.type === 'agreement') {
      setActiveSection('isi');
    } else if (content.includes('waris') || content.includes('saksi')) {
      setActiveSection('waris_saksi');
    } else if (content.includes('jual') || content.includes('beli') || content.includes('objek') || content.includes('tanah')) {
      setActiveSection('jual_beli');
    } else if (result.nama || result.nik) {
      setActiveSection('penduduk');
    } else {
      setActiveSection('isi');
    }
  };

  const resetForm = () => {
    onChange({ 
      ...INITIAL_DATA, 
      id: crypto.randomUUID(),
      nomorSurat: data.nomorSurat,
      tanggalSurat: new Date().toISOString().split('T')[0]
    });
    setActiveSection('umum');
  };

  const inputStyle = "w-full py-2.5 bg-paper/50 border border-line rounded-lg px-4 focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none font-sans text-sm transition-all placeholder:text-ink/20";
  const labelStyle = "block text-[10px] uppercase font-bold tracking-[2px] text-ink/40 mb-2 ml-1 font-heading";

  const sections = [
    { id: 'umum', label: 'Umum', icon: LayoutDashboard },
    { id: 'penduduk', label: data.type === 'admin' ? 'Penduduk' : 'Profil', icon: User },
    ...(data.type === 'admin' ? [
      { id: 'jual_beli', label: 'Objek', icon: Landmark },
      { id: 'waris_saksi', label: 'Pihak & Saksi', icon: Users },
    ] : []),
    ...(data.type === 'cv' ? [
      { id: 'cv_detail', label: 'Riwayat', icon: GraduationCap },
    ] : []),
    ...(data.type === 'sppd' ? [
      { id: 'sppd_detail', label: 'Detail SPPD', icon: MapPin },
    ] : []),
    { id: 'isi', label: data.type === 'cv' ? 'Tentang CV' : 'Isi Surat', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand & Global Actions */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div className="flex flex-col">
          <h1 className="font-display text-2xl leading-none font-extrabold text-ink tracking-tight mb-1.5 uppercase">
            SIS<span className="text-accent underline decoration-accent/20 decoration-2 underline-offset-4">DIGI</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-3 bg-accent/30" />
            <p className="text-[8px] uppercase tracking-[3px] font-bold text-ink/40 font-heading">Sistem Surat Digital</p>
          </div>
        </div>
        <button
          onClick={resetForm}
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl hover:bg-accent hover:text-paper active:scale-95 transition-all shadow-sm group"
          title="Buat Surat Baru"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest font-heading whitespace-nowrap">Refresh / Surat Baru</span>
        </button>
      </div>

      {/* Navigation Dropdown */}
      <div className="relative mb-6 md:mb-10 flex-shrink-0 group">
        <label className="block text-[10px] uppercase font-bold tracking-[2px] text-ink/30 mb-2.5 ml-1 transition-colors group-focus-within:text-accent font-heading">
          Navigasi Bagian
        </label>
        <div className="relative">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as FormSection)}
            className="w-full appearance-none py-4 pl-12 pr-12 bg-white border border-line rounded-2xl font-bold text-[11px] uppercase tracking-[1px] text-ink/80 hover:border-accent/40 focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none cursor-pointer transition-all duration-300 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-accent/5 group-hover:-translate-y-0.5"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id} className="font-bold py-2">
                {s.label}
              </option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none flex items-center justify-center">
            <div className="p-1.5 bg-bg border border-line rounded-lg shadow-sm transition-transform group-hover:scale-110">
              {sections.find(s => s.id === activeSection)?.icon && (
                React.createElement(sections.find(s => s.id === activeSection)!.icon, { className: "w-3.5 h-3.5" })
              )}
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/20 pointer-events-none group-hover:text-accent transition-colors">
            <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </div>
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
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <AIAssistant onGenerated={handleAIGeneration} />

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
                
                <div className="p-5 bg-accent/5 rounded-2xl border border-accent/10 space-y-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Konfigurasi Utama
                  </h3>

                  <div>
                    <label className={labelStyle}>Tipe Dokumen</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['admin', 'job_application', 'cv', 'sppd', 'agreement'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => onChange({ ...data, type: t })}
                          className={`py-2 px-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${data.type === t ? 'bg-ink text-paper border-ink shadow-lg shadow-ink/20' : 'bg-white border-line text-ink/40 hover:border-accent/30'}`}
                        >
                          {t === 'admin' ? 'Desa' : t === 'job_application' ? 'Lamaran' : t === 'sppd' ? 'SPPD' : t === 'cv' ? 'CV' : 'Perjanjian'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelStyle}>Judul Dokumen</label>
                    <input
                      type="text"
                      name="judulSurat"
                      value={data.judulSurat}
                      onChange={handleChange}
                      placeholder={data.type === 'cv' ? "CURRICULUM VITAE" : "Contoh: Surat Lamaran Kerja"}
                      className={inputStyle}
                    />
                  </div>
                  {data.type !== 'cv' && (
                    <div>
                      <label className={labelStyle}>Nomor Surat (Hanya Desa)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="nomorSurat"
                          value={data.nomorSurat}
                          onChange={handleChange}
                          disabled={data.type !== 'admin'}
                          className={`${inputStyle} ${data.type !== 'admin' ? 'opacity-50' : ''}`}
                        />
                        {data.type === 'admin' && (
                          <button
                            onClick={onRefreshNumber}
                            className="p-2.5 bg-white border border-line rounded-lg text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
                )}

                {data.type === 'job_application' && (
                  <div className="p-5 bg-paper border border-line rounded-2xl space-y-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Detail Lamaran
                    </h3>
                    <div>
                      <label className={labelStyle}>Posisi Yang Dilamar</label>
                      <input type="text" name="posisiDilamar" value={data.posisiDilamar} onChange={handleChange} className={inputStyle} placeholder="Contoh: Administrasi Staff" />
                    </div>
                    <div>
                      <label className={labelStyle}>Perusahaan Tujuan</label>
                      <input type="text" name="perusahaanTujuan" value={data.perusahaanTujuan} onChange={handleChange} className={inputStyle} placeholder="Contoh: PT. Maju Bersama" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'penduduk' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 bg-paper border border-line rounded-2xl space-y-6">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                    <User className="w-4 h-4" /> {data.type === 'admin' ? 'Data Personal Penduduk' : 'Identitas Pemohon'}
                  </h3>
                  <div>
                    <label className={labelStyle}>Nama Lengkap</label>
                    <input type="text" name="nama" value={data.nama} onChange={handleChange} className={`${inputStyle} font-bold text-ink uppercase tracking-wide`} />
                  </div>
                  {data.type === 'admin' && (
                    <div>
                      <label className={labelStyle}>NIK</label>
                      <input type="text" name="nik" value={data.nik} onChange={handleChange} className={inputStyle} />
                    </div>
                  )}
                  {data.type !== 'admin' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelStyle}>Email</label>
                        <input type="email" name="email" value={data.email} onChange={handleChange} className={inputStyle} />
                      </div>
                      <div>
                        <label className={labelStyle}>Telepon</label>
                        <input type="text" name="telepon" value={data.telepon} onChange={handleChange} className={inputStyle} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Tempat Lahir</label>
                      <input type="text" name="tempatLahir" value={data.tempatLahir} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                      <label className={labelStyle}>Tanggal Lahir</label>
                      <input type="date" name="tanggalLahir" value={data.tanggalLahir} onChange={handleChange} className={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelStyle}>Jenis Kelamin</label>
                      <select name="jenisKelamin" value={data.jenisKelamin} onChange={handleChange} className={inputStyle}>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Pekerjaan saat ini</label>
                      <input type="text" name="pekerjaan" value={data.pekerjaan} onChange={handleChange} className={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Alamat Lengkap</label>
                    <textarea name="alamat" value={data.alamat} onChange={handleChange} className={`${inputStyle} h-24 resize-none`} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'cv_detail' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Pendidikan */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Riwayat Pendidikan
                    </h3>
                    <button onClick={addEducation} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-ink text-paper rounded-full hover:bg-accent transition-colors">
                      Tambah
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.pendidikan.map((edu, idx) => (
                      <div key={idx} className="p-5 bg-paper border border-line rounded-2xl relative group">
                        <button onClick={() => removeEducation(idx)} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className={labelStyle}>Institusi / Sekolah</label>
                            <input type="text" value={edu.institusi} onChange={(e) => handleEducationChange(idx, 'institusi', e.target.value)} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Gelar / Jurusan</label>
                            <input type="text" value={edu.gelar} onChange={(e) => handleEducationChange(idx, 'gelar', e.target.value)} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Tahun</label>
                            <input type="text" value={edu.tahun} onChange={(e) => handleEducationChange(idx, 'tahun', e.target.value)} className={inputStyle} placeholder="2018 - 2022" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pengalaman */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Pengalaman Kerja
                    </h3>
                    <button onClick={addExperience} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-ink text-paper rounded-full hover:bg-accent transition-colors">
                      Tambah
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.pengalaman.map((exp, idx) => (
                      <div key={idx} className="p-5 bg-paper border border-line rounded-2xl relative group">
                        <button onClick={() => removeExperience(idx)} className="absolute top-4 right-4 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelStyle}>Perusahaan</label>
                              <input type="text" value={exp.perusahaan} onChange={(e) => handleExperienceChange(idx, 'perusahaan', e.target.value)} className={inputStyle} />
                            </div>
                            <div>
                              <label className={labelStyle}>Jabatan</label>
                              <input type="text" value={exp.posisi} onChange={(e) => handleExperienceChange(idx, 'posisi', e.target.value)} className={inputStyle} />
                            </div>
                          </div>
                          <div>
                            <label className={labelStyle}>Durasi</label>
                            <input type="text" value={exp.durasi} onChange={(e) => handleExperienceChange(idx, 'durasi', e.target.value)} className={inputStyle} placeholder="Jan 2022 - Mar 2024" />
                          </div>
                          <div>
                            <label className={labelStyle}>Deskripsi Pekerjaan</label>
                            <textarea value={exp.deskripsi} onChange={(e) => handleExperienceChange(idx, 'deskripsi', e.target.value)} className={`${inputStyle} h-20 resize-none`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keahlian */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Keahlian
                    </h3>
                    <button onClick={addSkill} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-ink text-paper rounded-full hover:bg-accent transition-colors">
                      Tambah
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data.keahlian.map((skill, idx) => (
                      <div key={idx} className="p-4 bg-paper border border-line rounded-xl relative group">
                        <button onClick={() => removeSkill(idx)} className="absolute top-2 right-2 text-ink/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <input type="text" value={skill.nama} onChange={(e) => handleSkillChange(idx, 'nama', e.target.value)} className={`${inputStyle} mb-2`} placeholder="Skill" />
                        <select value={skill.level} onChange={(e) => handleSkillChange(idx, 'level', e.target.value)} className={inputStyle}>
                          <option value="Pemula">Pemula</option>
                          <option value="Menengah">Menengah</option>
                          <option value="Ahli">Ahli</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sppd_detail' && data.type === 'sppd' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className={labelStyle}>Tujuan Perjalanan</label>
                    <input
                      type="text"
                      value={data.tujuanPerjalanan}
                      onChange={(e) => onChange({ ...data, tujuanPerjalanan: e.target.value })}
                      className={inputStyle}
                      placeholder="Contoh: Kantor Kabupaten Cakrawana"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Tanggal Berangkat</label>
                    <input
                      type="date"
                      value={data.tanggalBerangkat}
                      onChange={(e) => onChange({ ...data, tanggalBerangkat: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Tanggal Kembali</label>
                    <input
                      type="date"
                      value={data.tanggalKembali}
                      onChange={(e) => onChange({ ...data, tanggalKembali: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Alat Transportasi</label>
                    <input
                      type="text"
                      value={data.kendaraan}
                      onChange={(e) => onChange({ ...data, kendaraan: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Beban Anggaran</label>
                    <input
                      type="text"
                      value={data.bebanAnggaran}
                      onChange={(e) => onChange({ ...data, bebanAnggaran: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'jual_beli' && data.type === 'admin' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-5 bg-paper/30 border border-line border-dashed rounded-2xl flex items-center gap-3 text-ink/40 mb-2">
                  <Landmark className="w-5 h-5" />
                  <p className="text-[10px] uppercase font-bold tracking-widest leading-relaxed">Informasi Objek Jual Beli / Perjanjian</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Harga Transaksi (Opsional)</label>
                    <input 
                      type="text" 
                      name="hargaJualBeli" 
                      value={data.hargaJualBeli || ''} 
                      onChange={(e) => {
                        const formatted = formatRupiah(e.target.value);
                        onChange({ ...data, hargaJualBeli: formatted });
                      }} 
                      className={inputStyle} 
                      placeholder="Contoh: 150.000.000"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Detail Objek (Lokasi, Luas, Batas-batas)</label>
                    <textarea 
                      name="detailObjek" 
                      value={data.detailObjek || ''} 
                      onChange={handleChange} 
                      className={`${inputStyle} h-40 resize-none`}
                      placeholder="Contoh: Tanah seluas 200m2 berlokasi di Dsn Duwak Rampak, dengan batas Utara: Tanah Bapak A, Selatan: Jalan Desa, dst."
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
                    <button onClick={addHeir} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-ink text-paper rounded-full hover:bg-accent transition-colors">
                      Tambah
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
                            <label className={labelStyle}>Pihak {idx+1}</label>
                            <input type="text" value={heir.nama} onChange={(e) => handleHeirChange(idx, 'nama', e.target.value)} className={inputStyle} />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
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
                            <div className="col-span-2">
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
                    <button onClick={addWitness} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-ink text-paper rounded-full hover:bg-accent transition-colors">
                      Tambah
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
                            <label className={labelStyle}>Nama Saksi #{idx+1}</label>
                            <input type="text" value={witness.nama} onChange={(e) => handleWitnessChange(idx, 'nama', e.target.value)} className={inputStyle} />
                          </div>
                          <div>
                            <label className={labelStyle}>Jabatan / Peran</label>
                            <input type="text" value={witness.jabatan} onChange={(e) => handleWitnessChange(idx, 'jabatan', e.target.value)} className={inputStyle} />
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
                  <div>
                    <label className={labelStyle}>Paragraf Narasi</label>
                    <textarea name="narasiSurat" value={data.narasiSurat} onChange={handleChange} className={`${inputStyle} h-40 resize-none leading-relaxed`} />
                  </div>
                  <div>
                    <label className={labelStyle}>Untuk Keperluan</label>
                    <textarea name="keperluan" value={data.keperluan} onChange={handleChange} className={`${inputStyle} h-20 resize-none`} />
                  </div>
                  <div className="pt-4 border-t border-line space-y-4">
                    <div className="flex items-center gap-2 text-ink/40 mb-2">
                      <Signature className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Penanggung Jawab</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

