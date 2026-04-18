import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateLetterContent, GeneratedLetter } from '../services/geminiService';

interface Props {
  onGenerated: (result: GeneratedLetter) => void;
}

export const AIAssistant: React.FC<Props> = ({ onGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateLetterContent(prompt);
      onGenerated(result);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Gagal membuat konten. Pastikan koneksi internet aktif.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-accent/5 rounded-xl p-5 border border-accent/10 space-y-4">
      <div className="flex items-center gap-2 text-accent">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-sm font-bold uppercase tracking-wider">AI Assistant Surat</h3>
      </div>
      
      <p className="text-xs text-ink/60 leading-relaxed italic">
        Ketik jenis surat atau keperluan yang Anda butuhkan, AI akan membantu membuatkan judul dan kalimat yang formal.
      </p>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Contoh: Buat surat ahli waris untuk ambil warisan di bank"
          className="w-full p-3 bg-paper border border-line rounded-lg text-sm focus:border-accent outline-none min-h-[80px] transition-all"
        />
        
        {error && (
          <p className="text-[10px] text-red-500 font-medium">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Buat Otomatis
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {[
          'Ahli Waris - Alm. Ahmad',
          'SKTM - Budi Santoso',
          'Domisili tinggal', 
          'Jual Beli Tanah',
          'Lamaran Admin - PT Maju',
          'CV Desain Grafis',
        ].map((text) => (
          <button
            key={text}
            onClick={() => setPrompt(`Buatkan surat ${text}`)}
            className="text-[10px] px-2.5 py-1.5 bg-accent/10 text-accent rounded-full hover:bg-accent hover:text-white transition-colors border border-accent/20 font-medium"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};
