import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialize to ensure environment variables are loaded
let aiClient: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiClient) {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export interface GeneratedLetter {
  type: 'admin' | 'cv' | 'job_app' | 'business' | 'agreement';
  judulSurat: string;
  keperluan: string; // Used as objective for CV, or bill summary for Business
  narasiSurat: string; // Main body / cover letter content
  opsiNarasi: {
    label: string;
    text: string;
  }[];
  nama?: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  detailObjek?: string;
  hargaJualBeli?: string;
  penerima?: string; // Recipient (Yth) for Job App or Invitations
  lampiran?: string;
  tembusan?: string;
  memo?: string; // Auto-generated short summary/memo
  saranPertanyaan?: string[];
  items?: {
    deskripsi: string;
    kuantitas: number;
    satuan: string;
    hargaSatuan: number;
    total: number;
  }[];
  // CV & Job App specific
  email?: string;
  telepon?: string;
  linkedin?: string;
  portofolio?: string;
  pendidikan?: {
    sekolah: string;
    periode: string;
    jurusan: string;
    deskripsi: string;
  }[];
  pengalaman?: {
    perusahaan: string;
    periode: string;
    posisi: string;
    deskripsi: string;
  }[];
  keahlian?: string[];
  perusahaanTujuan?: string;
  posisiTujuan?: string;
}

export const generateLetterContent = async (prompt: string, retryCount = 0): Promise<GeneratedLetter> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{
        role: 'user',
        parts: [{
          text: `Anda adalah asisten administrasi profesional tingkat tinggi di Indonesia yang ahli dalam Tata Naskah Dinas dan korespondensi pemerintahan desa. 
Tugas Anda adalah membuat data surat berdasarkan permintaan: "${prompt}". 

Aturan Penulisan Utama:
1. FOKUS: Anda ahli dalam membuat 5 jenis dokumen:
   - "admin": Surat resmi desa (keterangan, pengantar, permohonan, ahli waris, dll).
     * KHUSUS SURAT PENGANTAR (misal: SKCK, Nikah, Pindah): Judul harus menyertakan tujuan (MISAL: SURAT PENGANTAR CATATAN KEPOLISIAN).
     * NARASI: Harus menyatakan bahwa orang tersebut adalah penduduk desa tersebut dan untuk keperluan apa surat pengantar dibuat.
   - "cv": Curriculum Vitae profesional (modern, ATS-friendly).
   - "job_app": Surat lamaran pekerjaan yang persuasif.
   - "business": Invoice, Kuitansi, atau Penawaran Harga. Anda WAJIB mengisi array "items" dengan rincian barang/jasa yang logis.
   - "agreement": Surat Perjanjian atau Kontrak Legal (Jual Beli, Sewa, Kerja). Gunakan gaya bahasa formal hukum Indonesia ("PIHAK PERTAMA", "PIHAK KEDUA", "PASAL").
2. PENGGUNAAN BAHASA: Gunakan Bahasa Indonesia Baku (EYD).
3. JUDUL: Gunakan KAPITAL untuk "admin", "business", dan "agreement". 
4. VARIASI NARASI: Berikan 3 pilihan narasi/cover letter (Formal, Kreatif, To-the-point).
5. CV DATA: Untuk "cv", isi field "keperluan" dengan riwayat objektif/summary profesional yang padat. Anda WAJIB mengisi array "pendidikan", "pengalaman", dan "keahlian" dengan data yang logis berdasarkan prompt.
6. LAMARAN KERJA: Pastikan "perusahaanTujuan" dan "posisiTujuan" terisi.
7. EKSTRAKSI CERDAS: Ekstrak email, telepon, dan link sosial media dari prompt jika tersedia.
8. SARAN PERTANYAAN: Jika data krusial (seperti rincian pengalaman kerja spesifik atau daftar sertifikat) tidak ada, berikan pertanyaan di "saranPertanyaan".
9. FITUR MEMO: Buat ringkasan sangat singkat (maksimal 2 kalimat) dalam field "memo" yang menjelaskan siapa, untuk apa, dan status surat ini. Gunakan tone yang netral dan informatif.
   - KHUSUS FIELD "detailObjek": JANGAN PERNAH mengisi data kelahiran anak secara otomatis jika data tersebut TIDAK ADA dalam prompt asli. Field ini harus tetap kosong ("") jika user tidak menyebutkan detail spesifik tersebut.

Output harus dalam format JSON murni.`,
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['admin', 'cv', 'job_app', 'business', 'agreement'] },
            judulSurat: { type: Type.STRING },
            keperluan: { type: Type.STRING },
            opsiNarasi: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["label", "text"]
              }
            },
            nama: { type: Type.STRING },
            email: { type: Type.STRING, description: "Professional email address extraction/generation" },
            telepon: { type: Type.STRING, description: "Contact number extraction/generation" },
            linkedin: { type: Type.STRING },
            portofolio: { type: Type.STRING },
            nik: { type: Type.STRING },
            tempatLahir: { type: Type.STRING },
            tanggalLahir: { type: Type.STRING },
            detailObjek: { type: Type.STRING },
            hargaJualBeli: { type: Type.STRING },
            penerima: { type: Type.STRING },
            lampiran: { type: Type.STRING },
            tembusan: { type: Type.STRING },
            perusahaanTujuan: { type: Type.STRING },
            posisiTujuan: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  deskripsi: { type: Type.STRING },
                  kuantitas: { type: Type.NUMBER },
                  satuan: { type: Type.STRING },
                  hargaSatuan: { type: Type.NUMBER },
                  total: { type: Type.NUMBER },
                }
              }
            },
            pendidikan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sekolah: { type: Type.STRING },
                  periode: { type: Type.STRING },
                  jurusan: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                }
              }
            },
            pengalaman: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  perusahaan: { type: Type.STRING },
                  periode: { type: Type.STRING },
                  posisi: { type: Type.STRING },
                  deskripsi: { type: Type.STRING },
                }
              }
            },
            keahlian: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            memo: { type: Type.STRING, description: "Ringkasan sangat singkat (1-2 kalimat) dari isi surat." },
            saranPertanyaan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["type", "judulSurat", "keperluan", "opsiNarasi"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    // Clean up markdown bold markers if AI still provides them
    const cleanValue = (val: any) => typeof val === 'string' ? val.replace(/\*\*/g, '') : val;
    
    const judulSurat = cleanValue(result.judulSurat) || "Surat Keterangan";
    const keperluan = cleanValue(result.keperluan) || "";
    const memo = cleanValue(result.memo) || "";
    const opsi = (result.opsiNarasi || []).map((o: any) => ({
      label: o.label,
      text: cleanValue(o.text)
    }));
    
    return {
      ...result,
      type: result.type || 'admin',
      judulSurat,
      keperluan,
      memo,
      narasiSurat: opsi[0]?.text || "Bahwa nama tersebut di atas adalah benar-benar penduduk Desa {desa}.",
      opsiNarasi: opsi,
    };
  } catch (error: any) {
    // Retry logic for transient network/RPC errors with backoff
    if (retryCount < 3 && error?.message && (error.message.includes("Rpc failed") || error.message.includes("xhr error") || error.message.includes("500"))) {
      const delay = Math.pow(2, retryCount) * 1500;
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateLetterContent(prompt, retryCount + 1);
    }

    const is403 = error?.error?.code === 403 || error?.code === 403 || (error?.message && error.message.includes("403"));
    const is404 = error?.error?.code === 404 || error?.code === 404 || (error?.message && error.message.includes("404"));
    const isRpcError = error?.message && (error.message.includes("Rpc failed") || error.message.includes("xhr error") || error.message.includes("network error"));
    const isQuota = error?.message && (error.message.includes("429") || error.message.includes("Quota"));
    
    if (is403) {
      throw new Error("Izin akses AI ditolak. Silakan periksa konfigurasi API Key Anda di menu Settings.");
    }

    if (is404) {
      throw new Error("Layanan AI tidak ditemukan (404). Model yang diminta mungkin tidak tersedia di wilayah Anda atau sudah kedaluwarsa.");
    }

    if (isQuota) {
      throw new Error("Batas pemakaian AI (Quota) terlampaui. Silakan tunggu beberapa menit atau gunakan API Key lain.");
    }

    if (isRpcError) {
      throw new Error(`Gagal terhubung ke layanan AI (Eror Jaringan/RPC). Hal ini bisa terjadi karena gangguan koneksi, ekstensi browser (Adblocker), atau proxy. Pastikan koneksi stabil & coba matikan Adblocker. detail: ${error.message.substring(0, 50)}`);
    }

    throw error;
  }
};

export const scanKtp = async (imageBase64: string, retryCount = 0): Promise<any> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1] || imageBase64
              }
            },
            {
              text: `Ekstrak data dari foto KTP Indonesia ini ke dalam format JSON. 
Instruksi Penting:
1. "nama": Nama lengkap sesuai KTP.
2. "nik": 16 digit NIK.
3. "tempatLahir": Kota tempat lahir.
4. "tanggalLahir": Format YYYY-MM-DD.
5. "jenisKelamin": Harus 'Laki-laki' atau 'Perempuan'.
6. "pekerjaan": Jenis pekerjaan sesuai KTP.
7. "alamat": Alamat lengkap termasuk RT/RW, Desa/Kelurahan, dan Kecamatan.

Pastikan output hanya JSON murni sesuai schema.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nama: { type: Type.STRING },
            nik: { type: Type.STRING },
            tempatLahir: { type: Type.STRING },
            tanggalLahir: { type: Type.STRING },
            jenisKelamin: { type: Type.STRING, enum: ['Laki-laki', 'Perempuan'] },
            pekerjaan: { type: Type.STRING },
            alamat: { type: Type.STRING },
          },
          required: ["nama", "nik", "tempatLahir", "tanggalLahir", "jenisKelamin", "pekerjaan", "alamat"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    // Retry logic for transient network/RPC errors
    if (retryCount < 3 && error?.message && (error.message.includes("Rpc failed") || error.message.includes("500"))) {
      const delay = Math.pow(2, retryCount) * 1500;
      await new Promise(resolve => setTimeout(resolve, delay));
      return scanKtp(imageBase64, retryCount + 1);
    }
    
    console.error("KTP Scanning Error:", error);
    throw new Error("Gagal memproses foto KTP (Eror Layanan AI). Pastikan foto jelas dan coba lagi dalam beberapa saat.");
  }
};

export const generateBannerImage = async (prompt: string, aspectRatio: string = "16:9"): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        role: "user",
        parts: [{ text: `Create a professional background for a banner. Topic: ${prompt}. The image should be abstract, high quality, and suitable for overlaying text without being too busy. Only return the image.` }]
      }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data received from AI.");
  } catch (error: any) {
    console.error("Banner Image Generation Error:", error);
    throw error;
  }
};
