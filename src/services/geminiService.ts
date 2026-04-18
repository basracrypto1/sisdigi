import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
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
      contents: `Anda adalah asisten administrasi profesional tingkat tinggi di Indonesia yang ahli dalam Tata Naskah Dinas dan korespondensi formal. 
      Tugas Anda adalah membuat data surat atau CV berdasarkan permintaan: "${prompt}". 
      
      Aturan Penulisan Utama:
      1. TENTUKAN TYPE SECARA TEPAT: 
         - 'admin': Surat keterangan desa, kelahiran, kematian, domisili, atau usaha.
         - 'job_application': Surat lamaran kerja profesional.
         - 'cv': Daftar Riwayat Hidup (Curriculum Vitae).
         - 'sppd': Surat Perintah Perjalanan Dinas resmi.
         - 'agreement': Surat Perjanjian, Kontrak, atau MoU.
      2. PENGGUNAAN BAHASA: Gunakan Bahasa Indonesia Baku (EYD), formal, sopan, dan persuasif sesuai konteks.
      3. JUDUL: Gunakan huruf KAPITAL, TEBAL, dan deskriptif (misal: SURAT KETERANGAN AHLI WARIS).
      4. NARASI STRUKTURAL: 
         - Jika 'admin': Gunakan pembukaan standar "Kepala Desa {desa}... menerangkan bahwa...". Gunakan "{desa}" sebagai placeholder.
         - Jika 'job_application': Gunakan format lamaran modern: pembukaan (darimana info didapat), posisi yang dilamar, kualifikasi singkat, dan penutup.
         - Jika 'agreement': Harus memiliki PASAL-PASAL (Pasal 1: Objek, Pasal 2: Harga, Pasal 3: Sanksi, dll). Sebutkan PIHAK PERTAMA dan PIHAK KEDUA secara jelas.
      5. EKSTRAKSI DATA: 
         - Ekstrak semua entitas: Nama, NIK, Tempat/Tgl Lahir, Alamat.
         - Tanggal lahir harus dalam format YYYY-MM-DD.
         - Jika 'sppd': Ekstrak tujuanPerjalanan, tanggalBerangkat, tanggalKembali, kendaraan, dan bebanAnggaran.
         - Jika 'cv': Buat detail Pendidikan, Pengalaman, dan Keahlian secara lengkap berdasarkan konteks atau narasi.
      
      Output harus dalam format JSON murni tanpa markdown prefix.`,
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
