import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const supabase = getSupabase();

    if (req.method === "POST") {
      const items = req.body;
      const toInsert = items.map((c: any) => ({
        id: c.id,
        nama: c.nama,
        nik: c.nik,
        tempat_lahir: c.tempatLahir,
        tanggal_lahir: c.tanggalLahir || null,
        jenis_kelamin: c.jenisKelamin,
        pekerjaan: c.pekerjaan,
        alamat: c.alamat,
        updated_at: c.updatedAt || new Date().toISOString(),
      }));
      const { data, error } = await supabase
        .from("citizens")
        .upsert(toInsert)
        .select();
      if (error) throw error;
      return res.json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
