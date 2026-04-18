import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Note: In this environment, GEMINI_API_KEY is usually injected by the platform.
    // If it's missing, it could be a configuration issue in the platform.
    console.warn("GEMINI_API_KEY is not defined in the environment.");
  }
  return key || "";
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export interface GeneratedLetter {
  type: 'admin' | 'job_application' | 'cv' | 'sppd' | 'agreement';
  judulSurat: string;
  keperluan: string;
  narasiSurat: string;
  nama?: string;
  nik?: string;
  email?: string;
  telepon?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  detailObjek?: string;
  hargaJualBeli?: string;
  perusahaanTujuan?: string;
  posisiDilamar?: string;
  tujuanPerjalanan?: string;
  tanggalBerangkat?: string;
  tanggalKembali?: string;
  kendaraan?: string;
  bebanAnggaran?: string;
  pendidikan?: { institusi: string; gelar: string; tahun: string }[];
  pengalaman?: { perusahaan: string; posisi: string; durasi: string; deskripsi: string }[];
  keahlian?: { nama: string; level: string }[];
}

export const generateLetterContent = async (prompt: string): Promise<GeneratedLetter> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Anda adalah asisten administrasi profesional di Indonesia. 
      Tugas Anda adalah membuat data surat atau CV berdasarkan permintaan: "${prompt}". 
      
      Aturan Penulisan:
      1. TENTUKAN TYPE: 
         - 'admin': Untuk surat desa, keterangan, dll.
         - 'job_application': Untuk surat lamaran kerja.
         - 'cv': Untuk Daftar Riwayat Hidup / CV.
         - 'sppd': Untuk Surat Perintah Perjalanan Dinas.
         - 'agreement': Untuk Surat Perjanjian Kerjasama, Penyertaan Modal, Kontrak, dll.
      2. JUDUL: Harus KAPITAL dan FORMAL.
      3. NARASI: 
         - Jika 'admin': Paragraf menerangkan status subjek atau perjanjian. Gunakan "{desa}" sebagai placeholder desa.
         - Jika 'job_application': Surat lamaran kerja yang sopan, menyebutkan posisi dan perusahaan tujuan.
         - Jika 'cv': Ringkasan profil profesional atau narasi singkat tentang diri.
         - Jika 'sppd': Ringkasan tujuan atau maksud perjalanan dinas.
         - Jika 'agreement': Draft surat perjanjian lengkap dengan pembukaan, identitas pihak (PIHAK PERTAMA, PIHAK KEDUA, dst), dan PASAL-PASAL (Pasal 1, Pasal 2, dst) yang relevan dengan permintaan (misal: Penyertaan Modal, Bagi Hasil, Jangka Waktu).
      4. EKSTRAKSI DATA: 
         - Ekstraksi Nama, NIK, Tempat/Tgl Lahir (YYYY-MM-DD).
         - Jika 'job_application': Ekstraksi posisiDilamar dan perusahaanTujuan.
         - Jika 'sppd': Ekstraksi tujuanPerjalanan, tanggalBerangkat, tanggalKembali, kendaraan, dan bebanAnggaran.
         - Jika ada Harga: Ekstraksi ke hargaJualBeli.
         - Jika ada Detail Lokasi/Batas: Ekstraksi ke detailObjek.
         - Jika 'cv': Ekstraksi Pendidikan (institusi, gelar, tahun), Pengalaman (perusahaan, posisi, durasi, deskripsi), dan Keahlian (nama, level).
      
      Berikan jawaban dalam format JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['admin', 'job_application', 'cv', 'sppd', 'agreement'] },
            judulSurat: { type: Type.STRING },
            narasiSurat: { type: Type.STRING },
            keperluan: { type: Type.STRING },
            nama: { type: Type.STRING },
            nik: { type: Type.STRING },
            email: { type: Type.STRING },
            telepon: { type: Type.STRING },
            tempatLahir: { type: Type.STRING },
            tanggalLahir: { type: Type.STRING },
            detailObjek: { type: Type.STRING },
            hargaJualBeli: { type: Type.STRING },
            perusahaanTujuan: { type: Type.STRING },
            posisiDilamar: { type: Type.STRING },
            tujuanPerjalanan: { type: Type.STRING },
            tanggalBerangkat: { type: Type.STRING },
            tanggalKembali: { type: Type.STRING },
            kendaraan: { type: Type.STRING },
            bebanAnggaran: { type: Type.STRING },
            pendidikan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institusi: { type: Type.STRING },
                  gelar: { type: Type.STRING },
                  tahun: { type: Type.STRING },
                }
              }
            },
            pengalaman: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  perusahaan: { type: Type.STRING },
                  posisi: { type: Type.STRING },
                  durasi: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                }
              }
            },
            keahlian: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nama: { type: Type.STRING },
                  level: { type: Type.STRING },
                }
              }
            }
          },
          required: ["type", "judulSurat", "narasiSurat", "keperluan"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      type: result.type || 'admin',
      judulSurat: result.judulSurat || "Surat Keterangan",
      narasiSurat: result.narasiSurat || "Bahwa nama tersebut di atas adalah benar-benar penduduk Desa {desa}.",
      keperluan: result.keperluan || "",
      ...result
    };
  } catch (error: any) {
    if (error?.error?.code === 403) {
      throw new Error("Izin akses AI ditolak. Silakan periksa konfigurasi API Key Anda di menu Settings.");
    }
    throw error;
  }
};
