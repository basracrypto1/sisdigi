import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, X, FileText, Zap, Search, MessageSquarePlus, HelpCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateLetterContent, GeneratedLetter } from '../services/geminiService';
import { storage } from '../lib/localDb';

interface Props {
  onGenerated: (result: GeneratedLetter) => void;
  currentType: 'admin' | 'cv' | 'job_app' | 'business' | 'agreement';
}

const ADMIN_TIPS = [
  "Surat Pengantar SKCK (Catatan Kepolisian)",
  "Surat Pengantar Menikah (Model N1-N4)",
  "Surat Keterangan Tidak Mampu (SKTM)",
  "Surat Keterangan Usaha (SKU) warung",
  "Surat Pengantar Pindah Domisili",
  "Surat Keterangan Penghasilan Wiraswasta",
  "Surat Keterangan Kematian",
  "Surat Pengantar Izin Keramaian",
  "Surat Keterangan Beda Nama (KTP/Ijazah)",
  "Kuitansi Jual Beli Tanah Desa"
];

const CV_TIPS = [
  "Curriculum Vitae (CV) Profesional",
  "CV Kreatif Desainer Grafis",
  "Resume ATS-Friendly Project Manager",
  "CV Modern Software Engineer",
  "Daftar Riwayat Hidup Fresh Graduate",
  "Digital Marketing Consultant CV",
  "Portfolio-centered Creative Resume",
  "Executive Summary for Senior Roles"
];

const JOB_APP_TIPS = [
  "Surat Lamaran Kerja - Staff Administrasi",
  "Surat Lamaran Kerja - Guru Honorer",
  "Surat Lamaran Kerja - Operator Produksi",
  "Permohonan Magang Mahasiswa",
  "Ijin Orang Tua untuk Bekerja",
  "Cover Letter for Sales Manager",
  "Application for Customer Service",
  "Entry-level Job Application Letter"
];

const BUSINESS_TIPS = [
  "Invoice Jasa Pembuatan Website",
  "Penawaran Harga Catering Pernikahan",
  "Kuitansi Pembayaran Sewa Kantor",
  "Tagihan Pengadaan Barang ATK",
  "Quotation Jasa Service AC",
  "Invoice Konsultasi Bisnis",
  "Billing Jasa Desain Interior",
  "Invoice Berlangganan Software"
];

const AGREEMENT_TIPS = [
  "Surat Perjanjian Jual Beli Tanah",
  "Kontrak Sewa Rumah 1 Tahun",
  "Perjanjian Kerjasama Bisnis (Profit Sharing)",
  "Kontrak Kerja Karyawan Swasta",
  "Surat Perjanjian Pinjam Meminjam Uang",
  "Perjanjian Jasa Freelance / Borongan",
  "Surat Kesepakatan Bersama Ganti Rugi",
  "Kontrak Kerjasama Vendor Event"
];

export const AIAssistant: React.FC<Props> = ({ onGenerated, currentType }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<GeneratedLetter | null>(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const MAX_CHARS = 1000;

  // Load persistence on mount
  useEffect(() => {
    const saved = storage.getAIState();
    if (saved.prompt) setPrompt(saved.prompt);
    if (saved.suggestion) setSuggestion(saved.suggestion);
  }, []);

  // Save persistence on changes
  useEffect(() => {
    // Only save if there's actually something to save to avoid clearing on initial loads
    if (prompt || suggestion) {
      storage.saveAIState({ prompt, suggestion });
    }
  }, [prompt, suggestion]);

  // Randomize tips based on current type
  const starterTips = React.useMemo(() => {
    let source = ADMIN_TIPS;
    if (currentType === 'cv') source = CV_TIPS;
    if (currentType === 'job_app') source = JOB_APP_TIPS;
    if (currentType === 'business') source = BUSINESS_TIPS;
    if (currentType === 'agreement') source = AGREEMENT_TIPS;
    
    return [...source]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [currentType]);

  // Effect to clear suggestion if type changes inconsistently? 
  // No, let's just refresh the placeholder
  const placeholder = React.useMemo(() => {
    switch (currentType) {
      case 'cv': return "Contoh: 'Tolong buatkan CV profesional sebagai Marketing'...";
      case 'job_app': return "Contoh: 'Buat surat lamaran kerja posisi Admin di PT Maju Mundur'...";
      case 'business': return "Contoh: 'Buat invoice jasa pembuatan website seharga 5 juta rupiah'...";
      case 'agreement': return "Contoh: 'Buat surat perjanjian sewa kos 1 tahun antara Budi dan Andi'...";
      default: return "Contoh: 'Buat surat keterangan tidak mampu (SKTM) untuk anak sekolah'...";
    }
  }, [currentType]);

  // Effect to reset state when document type changes - REMOVED strictly to avoid data loss
  // We keep it as a comment in case user wants forced clearing later
  /*
  React.useEffect(() => {
    setSuggestion(null);
    setPrompt('');
    setError(null);
  }, [currentType]);
  */

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setSelectedOption(0);
    try {
      const result = await generateLetterContent(prompt);
      
      if (!result || typeof result !== 'object') {
        throw new Error('Hasil dari AI tidak valid.');
      }

      const sanitizedResult: GeneratedLetter = {
        type: result.type || 'admin',
        judulSurat: result.judulSurat || 'SURAT KETERANGAN',
        keperluan: result.keperluan || 'Kebutuhan administrasi umum.',
        narasiSurat: result.narasiSurat || '',
        opsiNarasi: Array.isArray(result.opsiNarasi) && result.opsiNarasi.length > 0 
          ? result.opsiNarasi 
          : [{ label: 'Standar', text: result.narasiSurat || 'Isi surat belum dapat diolah dengan benar.' }],
        ...result
      };

      setSuggestion(sanitizedResult);
    } catch (err: any) {
      console.error('AI Processing Error:', err);
      
      const fallback: GeneratedLetter = {
        type: 'admin',
        judulSurat: 'SURAT KETERANGAN TERBATAS',
        keperluan: 'Administrasi internal.',
        narasiSurat: 'Data tidak dapat diproses sepenuhnya oleh AI saat ini. Harap lengkapi secara manual.',
        opsiNarasi: [
          { label: 'Standar', text: 'Data tidak dapat diproses sepenuhnya oleh AI saat ini. Harap lengkapi secara manual.' }
        ]
      };
      
      setSuggestion(fallback);

      let displayError = 'AI mengalami kesulitan memproses permintaan. Kami memberikan draf standar sebagai gantinya.';
      if (err.message) {
        displayError = err.message;
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      const selectedText = suggestion.opsiNarasi[selectedOption]?.text || suggestion.narasiSurat;
      const finalSuggestion: GeneratedLetter = {
        ...suggestion,
        narasiSurat: selectedText,
      };
      onGenerated(finalSuggestion);
      // We don't clear prompt/suggestion automatically to allow refining
      // setSuggestion(null);
      // setPrompt('');
    }
  };

  const clearPrompt = () => {
    setPrompt('');
    setError(null);
  };

  const handleQuickQuestion = (question: string) => {
    setSuggestion(null);
    setPrompt(prev => `${prev}\n\nInfo Tambahan: ${question.replace('?', '')} adalah ...`);
    const textarea = document.getElementById('ai-prompt') as HTMLTextAreaElement;
    textarea?.focus();
  };

  return (
    <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-accent">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[2px]">AI Assistant Cerdas</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-line rounded-full shadow-sm">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Sistem Aktif</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative group/textarea">
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            placeholder={placeholder}
            className="w-full p-5 pr-12 bg-white border-2 border-line/60 rounded-2xl text-sm focus:border-accent focus:ring-4 focus:ring-accent/5 outline-none min-h-[120px] transition-all resize-none shadow-sm group-hover/textarea:border-accent/30"
          />
          {prompt && (
            <button
              onClick={clearPrompt}
              className="absolute top-4 right-4 p-1.5 text-ink/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Bersihkan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="absolute bottom-4 right-4 text-[9px] font-black text-ink/20 tracking-widest tabular-nums uppercase">
            {prompt.length} / {MAX_CHARS}
          </div>
        </div>

        {/* Dynamic Starter Tips */}
        {!prompt && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="text-[9px] font-black text-ink/30 uppercase tracking-widest flex items-center gap-1.5 mr-1 py-1"><Lightbulb className="w-3 h-3" /> Rekomendasi:</span>
            {starterTips.map((tip, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(`Buatkan draf ${tip} . . .`)}
                className="px-3 py-1.5 bg-white border border-line rounded-full text-[9px] font-bold text-ink/60 hover:border-accent hover:text-accent transition-all shadow-sm"
              >
                {tip}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative group/select">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setPrompt(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full appearance-none p-3.5 px-5 bg-white border-2 border-line/60 rounded-2xl text-[10px] font-black uppercase tracking-widest text-accent cursor-pointer hover:border-accent focus:border-accent outline-none transition-all shadow-sm text-center"
            >
              <option value="">-- PILIH TEMPLAT TERRELEVAN --</option>
              {(currentType === 'cv' || currentType === 'job_app') && (
                <optgroup label="CV & Karir (Pilihan Utama)">
                  <option value="Buatkan Curriculum Vitae (CV) profesional untuk saya, sebutkan pendidikan di universitas negeri dan pengalaman kerja 2 tahun sebagai marketing">CV / Daftar Riwayat Hidup</option>
                  <option value="Buatkan surat lamaran kerja yang menarik untuk posisi Administrasi di PT. Karya Bangsa">Surat Lamaran Kerja (Admin)</option>
                  <option value="Buatkan surat lamaran kerja untuk posisi Guru SD dengan menekankan pengalaman mengajar saya">Surat Lamaran Kerja (Guru)</option>
                  <option value="Buatkan CV ATS-Friendly untuk software engineer dengan daftar keahlian React, Node.js, dan SQL">Resume ATS (IT Specialist)</option>
                </optgroup>
              )}
              {currentType === 'admin' && (
                <>
                  <optgroup label="Kependudukan & Identitas">
                    <option value="Buatkan surat pengantar pembuatan SKCK (Surat Keterangan Catatan Kepolisian)">Surat Pengantar SKCK</option>
                    <option value="Buatkan surat pengantar nikah (NA) untuk keperluan mendaftar di KUA">Surat Pengantar Nikah (NA)</option>
                    <option value="Buatkan surat pengantar pembuatan KTP Baru karena hilang atau rusak">Permohonan KTP Baru/Hilang</option>
                    <option value="Buatkan surat pengantar pembuatan/perubahan Kartu Keluarga (KK)">Permohonan Kartu Keluarga</option>
                    <option value="Buatkan surat pengantar pindah domisili (SKPWNI) antar kota untuk keperluan administrasi kependudukan">Surat Pengantar Pindah</option>
                    <option value="Buatkan surat keterangan domisili untuk melamar kerja atau lapor diri">Surat Keterangan Domisili</option>
                    <option value="Buatkan surat keterangan pindah (SKPWNI) antarkota/provinsi">Keterangan Pindah (SKPWNI)</option>
                    <option value="Buatkan surat keterangan beda nama pada dokumen KTP/Ijazah/BPJS">Keterangan Beda Nama</option>
                  </optgroup>
                  <optgroup label="Kesehatan & Sosial">
                    <option value="Buatkan surat keterangan tidak mampu (SKTM) untuk pengajuan beasiswa atau keringanan biaya">Keterangan Tidak Mampu (SKTM)</option>
                    <option value="Buatkan surat keterangan kematian untuk syarat pengurusan akta atau santunan">Keterangan Kematian</option>
                    <option value="Buatkan surat keterangan kelahiran untuk dasar pembuatan akta lahir">Keterangan Kelahiran</option>
                    <option value="Buatkan surat izin dari orang tua untuk keperluan kegiatan luar sekolah atau bekerja">Surat Izin Orang Tua</option>
                  </optgroup>
                  <optgroup label="Ekonomi & Usaha">
                    <option value="Buatkan surat keterangan usaha (SKU) untuk pengajuan pinjaman modal atau KUR">Keterangan Usaha (SKU)</option>
                    <option value="Buatkan surat keterangan penghasilan orang tua/wiraswasta untuk syarat pendidikan">Keterangan Penghasilan</option>
                    <option value="Buatkan surat pengantar izin keramaian untuk menyelenggarakan acara hajatan/pernikahan ke Polsek setempat">Surat Pengantar Izin Keramaian</option>
                  </optgroup>
                  <optgroup label="Undangan & Lembaga">
                    <option value="Buatkan surat undangan resmi lembaga pemerintah desa untuk rapat koordinasi pembangunan (Musrenbang)">Undangan Lembaga (Resmi)</option>
                    <option value="Buatkan surat undangan dinas resmi untuk koordinasi antar instansi atau eksternal">Undangan Dinas / Eksternal</option>
                    <option value="Buatkan surat undangan resmi rapat desa / musyawarah warga">Undangan Rapat Desa</option>
                    <option value="Buatkan surat undangan syukuran / walimatul ursy (pernikahan)">Undangan Pernikahan</option>
                    <option value="Buatkan surat undangan kerja bakti atau sosialisasi warga">Penyuluhan / Kerja Bakti</option>
                  </optgroup>
                </>
              )}
              <optgroup label="Lainnya">
                <option value="Buatkan invoice / tagihan pembayaran jasa profesional (misal: jasa desain, servis, atau konsultasi) dengan rincian biaya">Tagihan Jasa Profesional</option>
                <option value="Buatkan invoice penjualan barang dagangan dengan rincian item, harga satuan, dan total pembayaran">Tagihan Penjualan Barang</option>
                <option value="Buatkan kuitansi pembayaran resmi untuk transaksi jual beli tanah atau bangunan">Kuitansi Jual Beli Aset</option>
              </optgroup>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-accent group-hover/select:translate-y-[-30%] transition-transform">
              <ChevronDown className="w-4 h-4 opacity-50" />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:brightness-110 hover:shadow-xl hover:shadow-accent/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>MEMPROSES DATA...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white/20" />
                <span>BUAT REDAKSI OTOMATIS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <div className="p-1.5 bg-red-500 text-white rounded-full">
            <X className="w-3 h-3" />
          </div>
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider leading-relaxed">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 p-8 bg-white border-2 border-accent/20 rounded-3xl space-y-8 shadow-[0_30px_60px_-15px_rgba(var(--accent-rgb),0.15)] ring-12 ring-accent/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-accent uppercase tracking-[3px]">Draf AI Siap Ditinjau</span>
                </div>
                <button onClick={() => setSuggestion(null)} className="p-1.5 text-ink/20 hover:text-ink hover:bg-bg rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              {/* Follow-up Questions / Suggestions */}
              {suggestion.saranPertanyaan && suggestion.saranPertanyaan.length > 0 && (
                <div className="p-5 bg-accent/5 rounded-2xl border border-accent/10 space-y-3">
                  <div className="flex items-center gap-2 text-accent">
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Saran Kelengkapan Data:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.saranPertanyaan.map((q, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleQuickQuestion(q)}
                        className="px-3 py-2 bg-white border border-accent/20 rounded-xl text-[10px] font-bold text-accent hover:bg-accent hover:text-white transition-all shadow-sm flex items-center gap-2 group/q"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-[10px] uppercase font-black text-ink/30 tracking-[2px]">Judul Hasil Analisis:</p>
                </div>
                <div className="p-5 bg-bg/50 border border-line rounded-2xl">
                  <p className="text-base font-black text-ink leading-tight tracking-tight">{suggestion.judulSurat}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-ink/30 tracking-[2px]">Pilih Karakter Narasi:</p>
                <div className="grid grid-cols-1 gap-3">
                  {suggestion.opsiNarasi.map((option, idx) => {
                    const icons = [FileText, Zap, Search];
                    const Icon = icons[idx] || FileText;
                    const isActive = selectedOption === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        className={`
                          flex items-center gap-5 p-4 rounded-2xl border-2 transition-all text-left group/opt
                          ${isActive 
                            ? 'bg-accent/10 border-accent shadow-lg shadow-accent/5' 
                            : 'bg-paper border-line/60 hover:border-accent/40 hover:bg-accent/[0.02]'}
                        `}
                      >
                        <div className={`p-3 rounded-xl flex-shrink-0 transition-all duration-500 ${isActive ? 'bg-accent text-white scale-110' : 'bg-bg text-ink/20 group-hover/opt:text-accent/60'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={`text-[12px] font-black uppercase tracking-wider ${isActive ? 'text-accent' : 'text-ink/60'}`}>
                            {option.label}
                          </span>
                          <p className="text-[10px] text-ink/30 font-medium tracking-tight leading-none">Klik untuk menggunakan gaya bahasa ini</p>
                        </div>
                        {isActive && (
                          <div className="ml-auto pr-2">
                            <div className="w-3 h-3 bg-accent rounded-full shadow-[0_0_15px_rgba(var(--accent-rgb),0.6)]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black text-ink/30 tracking-[2px]">Pratinjau Redaksi:</p>
                <div className="bg-bg/40 p-6 rounded-2xl border-2 border-line/40 min-h-[140px] flex items-center relative overflow-hidden group/preview">
                  <div className="absolute top-0 right-0 p-3 opacity-5">
                    <FileText className="w-20 h-20" />
                  </div>
                  <p className="text-[11px] text-ink/80 italic leading-relaxed relative z-10 font-medium">
                    "{suggestion.opsiNarasi[selectedOption]?.text.substring(0, 450)}..."
                  </p>
                </div>
              </div>

              <button
                onClick={applySuggestion}
                className="w-full py-5 bg-accent text-white rounded-2xl text-[11px] font-black uppercase tracking-[3px] hover:brightness-110 active:scale-[0.98] transition-all shadow-2xl shadow-accent/30 flex items-center justify-center gap-4 relative overflow-hidden group/final"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/final:translate-y-0 transition-transform duration-500" />
                <Sparkles className="w-5 h-5 relative z-10" />
                <span className="relative z-10 text-[11px]">TERAPKAN draf KE FORMULIR</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
