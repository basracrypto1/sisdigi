import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const supabase = getSupabase();

    // GET - ambil semua surat
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return res.json(
        data.map((item: any) => ({
          ...item.content,
          id: item.id,
          updatedAt: item.updated_at,
        }))
      );
    }

    // POST - simpan atau update surat
    if (req.method === "POST") {
      const letter = req.body;

      const { data, error } = await supabase
        .from("letters")
        .upsert({
          id: letter.id,
          nomor_surat: letter.nomorSurat,
          content: letter,
          type: letter.type,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      return res.json(data[0]);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Letters API Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
