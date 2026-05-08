import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layout, 
  Image as ImageIcon, 
  Download, 
  History, 
  Settings2, 
  Palette, 
  Maximize2, 
  ChevronRight, 
  Smartphone, 
  Monitor, 
  Youtube, 
  Instagram, 
  Facebook, 
  ShoppingBag,
  FileText,
  MousePointer2,
  Type,
  Plus,
  X,
  Trash2,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  Check,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';

// --- Types ---
interface BannerPreset {
  id: string;
  name: string;
  icon: any;
  ratio: string;
  width: number;
  height: number;
  desc: string;
}

interface BannerStyle {
  id: string;
  name: string;
  prompt: string;
  preview: string;
}

interface BannerHistory {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

// --- Constants ---
const PRESETS: BannerPreset[] = [
  { id: '4k-wide', name: '4K Panoramic', icon: Monitor, ratio: '16:9', width: 3840, height: 2160, desc: 'Ultra HD Wide' },
  { id: 'ig-post', name: 'Instagram / Square', icon: Instagram, ratio: '1:1', width: 2160, height: 2160, desc: 'Standard Square' },
  { id: 'ig-story', name: 'Story / Reel', icon: Smartphone, ratio: '9:16', width: 2160, height: 3840, desc: 'Professional Vertical' },
  { id: 'baliho', name: 'Baliho / Billboard', icon: Monitor, ratio: '3:4', width: 2160, height: 2880, desc: 'Large Portrait' },
  { id: 'poster', name: 'Poster / Document', icon: FileText, ratio: '3:4', width: 2480, height: 3508, desc: 'Print Format' },
  { id: 'yt-thumb', name: 'YouTube / Ads', icon: Youtube, ratio: '16:9', width: 1920, height: 1080, desc: 'Full HD Wide' },
];

const STYLES: BannerStyle[] = [
  { id: 'outdoor', name: 'Outdoor Banner', prompt: 'photorealistic outdoor vinyl banner, high tension stretching from metal grommets, visible material wrinkles and physical creases from corners, all text and printed graphics must realistically follow the surface deformation and waves of the vinyl, physically accurate material texture, cinematic lighting', preview: 'https://picsum.photos/seed/vinyl/200/200' },
  { id: 'realistic', name: 'Realistis', prompt: 'photorealistic, high detail, 8k, professional photography, natural lighting', preview: 'https://picsum.photos/seed/realistic/200/200' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'cinematic lighting, dramatic shadows, movie still, highly atmospheric, anamorphic lenses', preview: 'https://picsum.photos/seed/cinematic/200/200' },
  { id: 'modern', name: 'Modern', prompt: 'modern minimalist design, clean lines, professional business aesthetic, contemporary', preview: 'https://picsum.photos/seed/modern/200/200' },
  { id: 'luxury', name: 'Luxury', prompt: 'premium luxury aesthetic, gold accents, elegant textures, high-end commercial style', preview: 'https://picsum.photos/seed/luxury/200/200' },
  { id: 'futuristic', name: 'Futuristic', prompt: 'cyberpunk aesthetic, neon glows, advanced technology, sci-fi concept art, holographic', preview: 'https://picsum.photos/seed/futuristic/200/200' },
  { id: 'islamic', name: 'Islamic', prompt: 'elegant islamic pattern, modest aesthetic, tranquil atmosphere, cultural heritage motifs', preview: 'https://picsum.photos/seed/islamic/200/200' },
  { id: 'minimalist', name: 'Minimalis', prompt: 'extreme minimal design, maximum negative space, simple shapes, bauhaus inspired', preview: 'https://picsum.photos/seed/minimal/200/200' },
  { id: 'neon', name: 'Neon', prompt: 'vibrant neon colors, retrowave aesthetic, glowing tubes, nocturnal cyberpunk vibe', preview: 'https://picsum.photos/seed/neon/200/200' },
  { id: 'corporate', name: 'Corporate', prompt: 'professional corporate identity, clean business environment, trustworthy commercial look', preview: 'https://picsum.photos/seed/corporate/200/200' },
];

const TEMPLATES = [
  { id: 'desa', name: 'Transparansi Desa', prompt: 'Banner resmi transparansi anggaran dana desa, layout tabel terstruktur, latar belakang vinyl putih dengan kerutan tegangan realistis, gaya terpasang di dinding, tipografi bersih, estetika pemerintah profesional. Tuliskan teks dalam Bahasa Indonesia.', colors: ['#000000', '#FFFFFF', '#FFCC00'] },
  { id: 'food', name: 'Promo Makanan', prompt: 'Promo restoran burger lezat dengan keju meleleh dan sayuran segar, poster promosi makanan, fotografi bokeh. Tuliskan teks promosi dalam Bahasa Indonesia yang menarik.', colors: ['#E63946', '#F1FAEE', '#A8DADC'] },
  { id: 'event', name: 'Event / Konser', prompt: 'Konser musik spektakuler di bawah lampu panggung, poster konser profesional, suasana energik. Tuliskan detail acara dalam Bahasa Indonesia.', colors: ['#1A1A1A', '#FF0055', '#4CC9F0'] },
  { id: 'tech', name: 'Teknologi', prompt: 'Smartphone elegan melayang di ruang digital abstrak, pameran produk teknologi tinggi, sirkuit bercahaya. Tuliskan fitur dalam Bahasa Indonesia.', colors: ['#000000', '#00FFCC', '#333333'] },
  { id: 'fashion', name: 'Fashion', prompt: 'Pemotretan editorial model busana kelas atas, pakaian trendi, latar belakang gaya jalanan perkotaan. Tuliskan teks fashion dalam Bahasa Indonesia.', colors: ['#FFFFFF', '#000000', '#F4A261'] },
];

export const AIBannerGenerator: React.FC = () => {
  // --- States ---
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<BannerHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'templates'>('create');
  
  // Advanced Config
  const [mainColor, setMainColor] = useState('#EF4444');
  const [lighting, setLighting] = useState('Natural');
  const [detailLevel, setDetailLevel] = useState('High');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Interactive Layers State
  const [layers, setLayers] = useState<{ id: string, text: string, x: number, y: number, fontSize: number, color: string }[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const addLayer = () => {
    const newLayer = {
      id: crypto.randomUUID(),
      text: 'Klik untuk ubah teks',
      x: 50,
      y: 50,
      fontSize: 32,
      color: '#ffffff'
    };
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, update: any) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...update } : l));
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  useEffect(() => {
    const saved = localStorage.getItem('banner_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // --- AI Functions ---
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const enhancePrompt = async () => {
    if (!prompt) return;
    try {
      setIsEnhancing(true);
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tingkatkan prompt ini agar menjadi instruksi desain grafis yang sangat profesional, realistis, dan estetik untuk sebuah banner. Cantumkan detail tentang komposisi, pencahayaan, tekstur, dan atmosphere. Prompt asli: "${prompt}". Hasil harus dalam Bahasa Inggris dan ringkas namun padat detail. Tanpa kata "Okay" atau penjelasan, langsung berikan prompt yang ditingkatkan saja.`
      });
      setPrompt(res.text.trim());
    } catch (error) {
      console.error("Enhance failed:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateBanner = async () => {
    if (!prompt) return;
    try {
      setIsGenerating(true);
      const physicalDetails = selectedStyle.id === 'outdoor' ? 'Tambahkan kerutan tegangan banner vinyl yang sangat realistis, lipatan di sudut, lubang mata ayam (eyelets), dan efek tegangan tali. Pastikan semua teks dan grafis mengikuti distorsi permukaan fisik dan gelombang material secara realistis.' : '';
      
      // Enhanced prompt with strict adherence instructions
      const finalPrompt = `INSTRUKSI UTAMA: Ikuti deskripsi pengguna berikut ini secara literal, akurat, dan sangat detail tanpa kekeliruan: "${prompt}". 
      Instruksi Tambahan:
      1. Gaya: ${selectedStyle.prompt}.
      2. ${physicalDetails}
      3. BAHASA: Wajib menggunakan Bahasa Indonesia untuk semua teks di dalam gambar.
      4. TEKSTUR & DETAIL: ${detailLevel} quality, ${lighting} lighting.
      5. WARNA: Tema warna utama adalah ${mainColor}.
      6. RASIO: Aspect ratio ${selectedPreset.ratio}.
      7. KEPATUHAN: Prioritaskan akurasi elemen yang disebutkan dalam deskripsi di atas sebelum estetika lainnya.`;
      
      const contents: any = { parts: [{ text: finalPrompt }] };
      if (referenceImage) {
        contents.parts.unshift({
          inlineData: {
            mimeType: "image/jpeg",
            data: referenceImage.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
        config: {
          imageConfig: {
            aspectRatio: selectedPreset.ratio as any
          }
        }
      });

      let imageUrl = '';
      for (const part of (response as any).candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        const newHistoryItem: BannerHistory = {
          id: crypto.randomUUID(),
          imageUrl,
          prompt,
          timestamp: Date.now()
        };
        
        const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
        setHistory(updatedHistory);
        
        try {
          // Only attempt to save a smaller subset to localStorage to avoid quota issues
          const persistHistory = updatedHistory.slice(0, 3);
          localStorage.setItem('banner_history', JSON.stringify(persistHistory));
        } catch (e) {
          console.warn("LocalStorage quota exceeded, history will not persist after refresh", e);
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Gagal membuat gambar. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf', quality: 'standard' | 'high' | 'raw' = 'high') => {
    if (!canvasRef.current || !generatedImage) return;

    // If 'raw' is selected and there are no layers, just download the AI result directly for maximum fidelity
    if (quality === 'raw' && layers.length === 0) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `banner-original-${Date.now()}.${format}`;
      link.click();
      return;
    }

    try {
      setIsGenerating(true); // Reuse loading state for "Rendering"
      setIsExporting(true); // Signal that we are capturing the canvas
      
      // Significantly increase scale for true high-res output
      // If the preview is 400px on mobile, scale 8 = 3200px (4K range)
      // If the preview is 800px on desktop, scale 5 = 4000px (4K range)
      const exportScale = quality === 'high' ? 6 : 2;

      // Small delay to ensure state updates have propagated to the DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(canvasRef.current, { 
        useCORS: true, 
        scale: exportScale,
        logging: false,
        backgroundColor: null,
        imageTimeout: 0,
        removeContainer: true
      });

      setIsExporting(false);

      // For PNG, 1.0 quality is implied (lossless)
      // For JPG, 0.95 is extremely high quality
      const dataUrl = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, 0.95);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `banner-4k-${Date.now()}.${format}`;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Gagal mengekspor gambar. Mencoba unduhan langsung...");
      // Fallback: direct download
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `banner-fallback-${Date.now()}.${format}`;
      link.click();
    } finally {
      setIsGenerating(false);
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReferenceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setPrompt(template.prompt);
    setMainColor(template.colors[1]);
    setActiveTab('create');
  };

  return (
    <div className="h-full flex flex-col bg-bg overflow-hidden transition-colors">
      {/* Header */}
      <header className="h-16 shrink-0 lg:h-20 flex items-center justify-between px-4 lg:px-8 bg-paper border-b border-line shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="p-2 lg:p-3 bg-accent/10 rounded-xl lg:rounded-2xl shrink-0">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black uppercase tracking-tight leading-none">Banner <span className="text-accent underline decoration-accent/20">Studio</span></h1>
            <p className="hidden xs:block text-[7px] lg:text-[9px] font-black text-ink/30 tracking-[2px] lg:tracking-[3px] uppercase mt-1">Premium AI Layout Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <div className="flex bg-bg p-1 rounded-xl border border-line">
            {[
              { id: 'create', icon: Plus, label: 'Create' },
              { id: 'templates', icon: Layout, label: 'Templates' },
              { id: 'history', icon: History, label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-paper text-ink shadow-sm' : 'text-ink/30 hover:text-accent'}`}
              >
                <tab.icon className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        {/* Sidebar Controls - Adaptive */}
        <aside className="w-full lg:w-96 shrink-0 lg:border-r border-line bg-paper flex flex-col lg:overflow-y-auto lg:h-[calc(100vh-80px)] shadow-xl lg:shadow-none z-20">
          <div className="p-8 space-y-10">
            {/* Input Prompt */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" /> Deskripsi Banner
                </label>
                <button 
                  onClick={enhancePrompt} 
                  disabled={!prompt || isEnhancing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all disabled:opacity-30"
                >
                  {isEnhancing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} AI Optimize
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Jelaskan banner impian Anda... (Contoh: Banner promo kopi modern dengan background kayu dan cahaya hangat)"
                className="w-full h-32 p-4 bg-bg border border-line rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-medium text-sm leading-relaxed"
              />
            </div>

            {/* Sizes / Presets */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5" /> Ukuran & Rasio
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPreset(p)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedPreset.id === p.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-line hover:border-accent/40'}`}
                  >
                    <p.icon className={`w-5 h-5 ${selectedPreset.id === p.id ? 'text-accent' : 'text-ink/30'}`} />
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-tight">{p.name}</p>
                      <p className="text-[8px] font-medium text-ink/40">{p.ratio}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Style Visual
              </label>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s)}
                    className={`shrink-0 w-24 space-y-2 group transition-all`}
                  >
                    <div className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedStyle.id === s.id ? 'border-accent ring-2 ring-accent/20 scale-105' : 'border-line'}`}>
                      <img src={s.preview} alt={s.name} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0" />
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center ${selectedStyle.id === s.id ? 'text-accent' : 'text-ink/40'}`}>{s.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-6 pt-4 border-t border-line/40">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-ink/30">Warna Utama</label>
                  <div className="flex items-center gap-3 bg-bg p-2 rounded-xl border border-line">
                    <input type="color" value={mainColor} onChange={(e) => setMainColor(e.target.value)} className="w-6 h-6 rounded-lg overflow-hidden border-none cursor-pointer" />
                    <span className="text-[10px] font-bold text-ink/60 uppercase">{mainColor}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-ink/30">Lighting</label>
                  <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full p-2 bg-bg border border-line rounded-xl text-[10px] font-bold">
                    <option>Natural</option>
                    <option>Soft</option>
                    <option>Dramatic</option>
                    <option>Neon Glow</option>
                    <option>Studio</option>
                  </select>
                </div>
              </div>

              {/* Reference Image */}
              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase tracking-widest text-ink/30 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Referensi Gambar / Logo
                </label>
                <div className="relative group">
                  <label className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${referenceImage ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/40 bg-bg'}`}>
                    {referenceImage ? (
                      <div className="relative w-full h-full">
                        <img src={referenceImage} alt="Ref" className="w-full h-full object-cover rounded-xl" />
                        <button onClick={(e) => { e.preventDefault(); setReferenceImage(null); }} className="absolute -top-2 -right-2 p-1.5 bg-ink text-white rounded-full shadow-lg hover:bg-accent transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-ink/20" />
                        <span className="text-[9px] font-black text-ink/30 uppercase">Upload File</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            </div>

            {/* Layer Controls */}
            {generatedImage && (
              <div className="space-y-6 pt-6 border-t border-line/40">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ink/40 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Elemen Teks
                  </label>
                  <button onClick={addLayer} className="p-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {selectedLayerId && (
                  <div className="p-5 bg-bg border border-line rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-ink/40">Isi Teks</label>
                      <input 
                        type="text" 
                        value={layers.find(l => l.id === selectedLayerId)?.text || ''} 
                        onChange={(e) => updateLayer(selectedLayerId, { text: e.target.value })}
                        className="w-full p-3 bg-white border border-line rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-ink/40">Ukuran</label>
                        <input 
                          type="range" 
                          min="12" 
                          max="120" 
                          value={layers.find(l => l.id === selectedLayerId)?.fontSize || 32} 
                          onChange={(e) => updateLayer(selectedLayerId, { fontSize: parseInt(e.target.value) })}
                          className="w-full accent-accent"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black uppercase tracking-widest text-ink/40">Warna</label>
                        <input 
                          type="color" 
                          value={layers.find(l => l.id === selectedLayerId)?.color || '#ffffff'} 
                          onChange={(e) => updateLayer(selectedLayerId, { color: e.target.value })}
                          className="w-full h-8 rounded-lg border-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={generateBanner}
              disabled={!prompt || isGenerating}
              className={`w-full h-16 rounded-2xl bg-accent text-white font-black text-xs tracking-[3px] uppercase shadow-2xl flex items-center justify-center gap-4 group relative overflow-hidden transition-all active:scale-95 disabled:opacity-40`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  CREATING MASTERPIECE...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  GENERATE BANNER
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Preview Area */}
        <section className="flex-1 lg:overflow-y-auto p-4 lg:p-12 bg-bg flex flex-col items-center pb-20 lg:pb-12">
          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <div key="canvas" className="w-full flex flex-col items-center space-y-10">
                {/* Canvas Container */}
                <div 
                  className={`relative bg-white shadow-2xl rounded-2xl overflow-hidden group transition-all duration-700 ${!generatedImage ? 'border-4 border-dashed border-line animate-pulse' : ''}`}
                  style={{
                    width: 'min(100%, 800px)',
                    aspectRatio: selectedPreset.ratio.includes(':') ? selectedPreset.ratio.replace(':', '/') : selectedPreset.ratio,
                  }}
                >
                  <div ref={canvasRef} className="w-full h-full relative">
                    {generatedImage ? (
                      <div className="w-full h-full relative">
                        <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        
                        {/* Interactive Text Layers */}
                        {layers.map((layer) => (
                          <motion.div
                            key={layer.id}
                            drag
                            dragMomentum={false}
                            onDrag={(e, info) => {
                              // We don't update state during drag for performance, but we could
                            }}
                            className={`absolute cursor-move select-none p-2 rounded transition-all group/layer ${isExporting ? 'border-transparent' : selectedLayerId === layer.id ? 'border-2 border-accent ring-2 ring-accent/20' : 'border-2 border-transparent hover:border-white/40'}`}
                            style={{ 
                              left: `${layer.x}%`, 
                              top: `${layer.y}%`,
                              color: layer.color,
                              fontSize: `${layer.fontSize}px`,
                              fontWeight: 'black',
                              textShadow: '2px 2px 10px rgba(0,0,0,0.5)',
                              zIndex: selectedLayerId === layer.id ? 50 : 10,
                              visibility: (isExporting && layer.text === 'Klik untuk ubah teks') ? 'hidden' : 'visible'
                            }}
                            onMouseDown={() => setSelectedLayerId(layer.id)}
                          >
                            {layer.text}
                            {selectedLayerId === layer.id && !isExporting && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center scale-0 group-hover/layer:scale-100 transition-transform shadow-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <div className="w-20 h-20 rounded-3xl bg-accent/5 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-accent/20" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest text-ink/20">Canvas Virtual</p>
                          <p className="text-xs font-medium text-ink/10 mt-1 max-w-xs mx-auto italic">Tulis deskripsi dan tekan generate untuk mulai berkarya</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Canvas Overlays (Interactive UI) */}
                  {generatedImage && !isGenerating && (
                    <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-6">
                      <button onClick={() => handleExport('png')} className="px-8 py-4 bg-white text-ink rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-accent hover:text-white transition-all flex items-center gap-3">
                        <Download className="w-4 h-4" /> Export HD PNG
                      </button>
                      <button onClick={() => setGeneratedImage(null)} className="px-8 py-4 bg-white/20 border border-white/40 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-red-500 hover:border-red-500 transition-all flex items-center gap-3">
                        <Trash2 className="w-4 h-4" /> Reset
                      </button>
                    </div>
                  )}

                  {/* Loading State Overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-6">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                        <div className="w-16 h-16 border-4 border-line border-t-accent rounded-full" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-[3px] text-accent animate-pulse">AI is Designing</p>
                        <p className="text-[10px] font-medium text-ink/40 mt-2 uppercase tracking-widest">Applying Professional Layout...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Options Mini */}
                {generatedImage && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-center gap-4 p-5 bg-paper rounded-3xl border border-line shadow-xl">
                    <div className="flex flex-wrap items-center justify-center gap-2 pr-0 lg:pr-4 lg:border-r border-line w-full lg:w-auto pb-4 lg:pb-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-ink/40 tracking-widest">Ready to Export</span>
                    </div>
                    <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
                      <button onClick={() => handleExport('png', 'high')} className="px-4 lg:px-6 py-3 bg-accent text-white hover:bg-accent/80 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20">
                        <Download className="w-3.5 h-3.5" /> PNG 4K
                      </button>
                      <button onClick={() => handleExport('jpg', 'high')} className="px-4 lg:px-6 py-3 bg-bg hover:bg-line rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                        JPG
                      </button>
                      <button onClick={() => handleExport('png', 'raw')} className="px-4 lg:px-6 py-3 bg-bg hover:bg-line rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                        RAW
                      </button>
                      <button onClick={() => handleExport('pdf', 'high')} className="px-4 lg:px-6 py-3 bg-bg hover:bg-line rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                        PDF
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : activeTab === 'history' ? (
              <div key="history" className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3 text-ink">
                    <History className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-black uppercase tracking-tight">Recent Works</h2>
                  </div>
                  <button onClick={() => { setHistory([]); localStorage.removeItem('banner_history'); }} className="text-[9px] font-black uppercase text-red-500 hover:underline">Clear History</button>
                </div>
                
                {history.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {history.map((item) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        key={item.id} 
                        className="group bg-paper rounded-3xl overflow-hidden border border-line shadow-sm hover:shadow-2xl transition-all"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          <img src={item.imageUrl} alt="History" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-ink/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all gap-4">
                            <button onClick={() => { setGeneratedImage(item.imageUrl); setPrompt(item.prompt); setActiveTab('create'); }} className="p-3 bg-white text-ink rounded-xl hover:bg-accent hover:text-white transition-all">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <a href={item.imageUrl} download={`banner-${item.id}.png`} className="p-3 bg-white text-ink rounded-xl hover:bg-accent hover:text-white transition-all">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <div className="p-5">
                          <p className="text-[10px] font-bold text-ink line-clamp-2 leading-relaxed mb-2 uppercase">{item.prompt}</p>
                          <div className="flex items-center gap-2 text-[8px] font-medium text-ink/30 uppercase">
                            <Clock className="w-3 h-3" />
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                    <History className="w-16 h-16" />
                    <p className="text-[10px] font-black uppercase tracking-[4px]">History is empty</p>
                  </div>
                )}
              </div>
            ) : (
              <div key="templates" className="w-full max-w-5xl">
                <div className="flex items-center gap-3 mb-10 text-ink">
                  <Layout className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-black uppercase tracking-tight">Professional Templates</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="group relative h-48 lg:h-64 bg-paper rounded-3xl overflow-hidden border border-line shadow-sm hover:shadow-2xl transition-all text-left"
                    >
                      <div className="absolute inset-0 p-4 lg:p-8 flex flex-col justify-end bg-gradient-to-t from-ink/80 via-ink/20 to-transparent z-10">
                        <h3 className="text-white text-base lg:text-lg font-black uppercase leading-none mb-2">{t.name}</h3>
                        <p className="text-white/60 text-[8px] lg:text-[9px] font-medium leading-relaxed max-w-xs line-clamp-1 lg:line-clamp-none">{t.prompt}</p>
                      </div>
                      <img src={`https://picsum.photos/seed/${t.id}/600/400`} alt={t.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Floating Status / Toast */}
      {isGenerating && (
        <div className="fixed bottom-10 right-10 z-[100] px-8 py-5 bg-ink text-white rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 animate-slide-up">
          <div className="relative">
            <RefreshCw className="w-6 h-6 text-accent animate-spin" />
            <div className="absolute inset-0 blur-md bg-accent/40 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">AI Engine Active</p>
            <p className="text-[9px] font-medium text-white/40 uppercase tracking-widest">Optimizing Canvas Layout...</p>
          </div>
        </div>
      )}
    </div>
  );
};
