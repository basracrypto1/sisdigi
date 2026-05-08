import { GoogleGenAI } from "@google/genai";

interface RabInput {
  judul: string;
  total_anggaran: number;
  jenis: string;
  keterangan?: string;
}

export const generateRabAI = async (input: RabInput) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
  Anda adalah seorang ahli estimasi biaya (Quantity Surveyor) profesional di Indonesia.
  Buat rincian anggaran biaya (RAB) yang realistis, logis, dan detail untuk kegiatan berikut:
  - Judul: ${input.judul}
  - Jenis Kegiatan: ${input.jenis}
  - Total Dana Tersedia: Rp ${input.total_anggaran.toLocaleString('id-ID')}
  - Keterangan Tambahan: ${input.keterangan || 'Tidak ada'}

  INSTRUKSI KHUSUS:
  1. Bagikan total anggaran secara proporsional dan masuk akal sesuai standar harga di Indonesia saat ini.
  2. Pastikan TOTAL AKHIR dari semua item rincian TEPAT SAMA dengan nominal Rp ${input.total_anggaran}. Jangan lebih, jangan kurang.
  3. Gunakan kategori yang relevan (misal: Material, Upah Pekerja, Operasional, Peralatan, Konsumsi, Biaya Tak Terduga).
  4. Berikan output HANYA DALAM FORMAT JSON murni tanpa markdown, tanpa teks pembuka/penutup.
  5. Format JSON harus seperti ini:
  {
    "judul": "${input.judul}",
    "total_anggaran": ${input.total_anggaran},
    "jenis": "${input.jenis}",
    "items": [
      {
        "nama_item": "Semen PC 50kg",
        "qty": 50,
        "satuan": "Zak",
        "harga_satuan": 65000,
        "subtotal": 3250000
      }
    ]
  }

  Pastikan semua angka (qty, harga_satuan, subtotal) adalah numerik, bukan string.
  Pastikan subtotal = qty * harga_satuan.
  Pastikan jumlah total seluruh subtotal = ${input.total_anggaran}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI tidak memberikan respon teks.");
    const data = JSON.parse(text);

    // Final balancing check
    let currentTotal = data.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const diff = input.total_anggaran - currentTotal;

    if (diff !== 0 && data.items.length > 0) {
      data.items[data.items.length - 1].subtotal += diff;
    }

    return data;
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    throw new Error("Gagal berkomunikasi dengan AI. " + error.message);
  }
};
