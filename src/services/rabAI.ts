import { GoogleGenAI, Type } from "@google/genai";

interface RabInput {
  judul: string;
  total_anggaran: number;
  jenis: string;
  keterangan?: string;
  level?: 1 | 2 | 3;
}

export const generateRabAI = async (input: RabInput) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const levelDescription = {
    1: "SINGKAT (5-7 item utama saja)",
    2: "STANDAR (10-15 item rincian umum)",
    3: "SANGAT RINCI (20+ item rincian mendalam termasuk komponen terkecil)"
  }[input.level || 2];

  const prompt = `
  Anda adalah seorang ahli estimasi biaya (Quantity Surveyor) profesional di Indonesia.
  Buat rincian anggaran biaya (RAB) yang realistis, logis, dan detail untuk kegiatan berikut:
  - Judul: ${input.judul}
  - Jenis Kegiatan: ${input.jenis}
  - Total Dana Tersedia: Rp ${input.total_anggaran.toLocaleString('id-ID')}
  - Keterangan Tambahan: ${input.keterangan || 'Tidak ada'}
  - Tingkat Detail: ${levelDescription}

  INSTRUKSI KHUSUS:
  1. Bagikan total anggaran secara proporsional dan masuk akal sesuai standar harga di Indonesia saat ini.
  2. Pastikan TOTAL AKHIR dari semua item rincian TEPAT SAMA dengan nominal Rp ${input.total_anggaran}.
  3. Gunakan kategori yang relevan.
  4. Berikan output dalam format JSON sesuai schema.
  5. Pastikan subtotal = qty * harga_satuan.
  6. Pastikan jumlah total seluruh subtotal = ${input.total_anggaran}.
  7. Sesuaikan jumlah item rincian dengan Tingkat Detail yang diminta: ${levelDescription}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["judul", "total_anggaran", "jenis", "items"],
          properties: {
            judul: { type: Type.STRING },
            total_anggaran: { type: Type.NUMBER },
            jenis: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["nama_item", "qty", "satuan", "harga_satuan", "subtotal"],
                properties: {
                  nama_item: { type: Type.STRING },
                  qty: { type: Type.NUMBER },
                  satuan: { type: Type.STRING },
                  harga_satuan: { type: Type.NUMBER },
                  subtotal: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI tidak memberikan respon teks.");
    const data = JSON.parse(text);

    // Final balancing check to ensure precision
    let currentTotal = data.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const diff = input.total_anggaran - currentTotal;

    if (diff !== 0 && data.items.length > 0) {
      data.items[data.items.length - 1].subtotal += diff;
    }

    return data;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Quota AI habis. Silakan coba lagi nanti.");
    }
    console.error("Gemini AI API Error:", error);
    throw new Error("Gagal berkomunikasi dengan AI. " + error.message);
  }
};
