-- Jalankan query ini di SQL Editor Supabase Anda untuk membuat tabel citizens

CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_surat TEXT,
  type TEXT,
  content JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Matikan RLS agar server bisa menyimpan data tanpa hambatan kebijakan keamanan
ALTER TABLE letters DISABLE ROW LEVEL SECURITY;

-- Jika RLS tetap aktif di level proyek, buat kebijakan "IZINKAN SEMUA" sebagai lapis kedua
DROP POLICY IF EXISTS "Allow all for letters" ON letters;
CREATE POLICY "Allow all for letters" ON letters FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  nik TEXT NOT NULL UNIQUE,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  jenis_kelamin TEXT CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  pekerjaan TEXT,
  alamat TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Matikan RLS agar server bisa menyimpan data tanpa hambatan kebijakan keamanan
ALTER TABLE citizens DISABLE ROW LEVEL SECURITY;

-- Jika RLS tetap aktif di level proyek, buat kebijakan "IZINKAN SEMUA" sebagai lapis kedua
DROP POLICY IF EXISTS "Allow all for citizens" ON citizens;
CREATE POLICY "Allow all for citizens" ON citizens FOR ALL USING (true) WITH CHECK (true);

-- Tambahkan index untuk pencarian yang lebih cepat
CREATE INDEX IF NOT EXISTS idx_citizens_nama ON citizens (nama);
CREATE INDEX IF NOT EXISTS idx_citizens_nik ON citizens (nik);
