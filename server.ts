import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy initialization of Supabase
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;https://ahespvxcmzikldtgcpxi.supabase.co
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXNwdnhjbXppa2xkdGdjcHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzEzNjMsImV4cCI6MjA5MjIwNzM2M30.pa1ueS-eQ2vwEwFydX1ssNAmxIL_OwZbKIjHqhffckM
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan("dev"));

  // API Route: Get all letters
  app.get("/api/letters", async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      res.json(data.map((item: any) => ({ ...item.content, id: item.id, updatedAt: item.updated_at })));
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Save or Update a letter
  app.post("/api/letters", async (req, res) => {
    try {
      const supabase = getSupabase();
      const letter = req.body;
      
      const { data, error } = await supabase
        .from("letters")
        .upsert({
          id: letter.id,
          nomor_surat: letter.nomorSurat,
          content: letter,
          type: letter.type,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error: any) {
      console.error("Save Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Delete a letter
  app.delete("/api/letters/:id", async (req, res) => {
    try {
      const supabase = getSupabase();
      const { id } = req.params;
      const { error } = await supabase.from("letters").delete().eq("id", id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Get all citizens
  app.get("/api/citizens", async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("citizens")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Fetch Citizens Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Save or Update a citizen
  app.post("/api/citizens", async (req, res) => {
    try {
      const supabase = getSupabase();
      const citizen = req.body;
      
      const { data, error } = await supabase
        .from("citizens")
        .upsert({
          id: citizen.id,
          nama: citizen.nama,
          nik: citizen.nik,
          tempat_lahir: citizen.tempatLahir,
          tanggal_lahir: citizen.tanggalLahir || null,
          jenis_kelamin: citizen.jenisKelamin,
          pekerjaan: citizen.pekerjaan,
          alamat: citizen.alamat,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error("Supabase Save Citizen Error:", error);
        throw error;
      }
      res.json(data[0]);
    } catch (error: any) {
      console.error("Save Citizen Route Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Delete a citizen
  app.delete("/api/citizens/:id", async (req, res) => {
    try {
      const supabase = getSupabase();
      const { id } = req.params;
      const { error } = await supabase.from("citizens").delete().eq("id", id);
      if (error) {
        console.error("Supabase Delete Citizen Error:", error);
        throw error;
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete Citizen Route Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Batch save citizens (for migration)
  app.post("/api/citizens/batch", async (req, res) => {
    try {
      const supabase = getSupabase();
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
        updated_at: c.updatedAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from("citizens")
        .upsert(toInsert)
        .select();

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Batch Save Citizens Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
