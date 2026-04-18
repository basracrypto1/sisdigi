export interface Heir {
  nama: string;
  nik: string;
  hubungan: string;
  peran?: string; // e.g., 'Penjual', 'Pembeli', 'Penerima'
}

export interface Witness {
  nama: string;
  jabatan: string;
}

export interface Education {
  institusi: string;
  gelar: string;
  tahun: string;
}

export interface Experience {
  perusahaan: string;
  posisi: string;
  durasi: string;
  deskripsi: string;
}

export interface Skill {
  nama: string;
  level: string; // e.g., 'Pemula', 'Menengah', 'Ahli'
}

export interface LetterData {
  id: string;
  type: 'admin' | 'job_application' | 'cv' | 'sppd' | 'agreement';
  nomorSurat: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamatDesa: string;
  nama: string;
  nik: string;
  email?: string;
  telepon?: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  pekerjaan: string;
  alamat: string;
  keperluan: string;
  judulSurat: string;
  narasiSurat: string;
  tanggalSurat: string;
  namaKades: string;
  jabatanKades: string;
  ahliWaris: Heir[];
  saksi: Witness[];
  pendidikan: Education[];
  pengalaman: Experience[];
  keahlian: Skill[];
  logoKabupaten: string;
  detailObjek?: string; // Specific for Land/Property sales
  hargaJualBeli?: string; // Specific for sales
  perusahaanTujuan?: string; // For Job Application
  posisiDilamar?: string; // For Job Application
  // SPPD Fields
  tujuanPerjalanan?: string;
  tanggalBerangkat?: string;
  tanggalKembali?: string;
  kendaraan?: string;
  bebanAnggaran?: string;
}

export interface SavedLetter extends LetterData {
  updatedAt: string;
}

export const INITIAL_DATA: LetterData = {
  id: crypto.randomUUID(),
  type: 'admin',
  nomorSurat: '',
  kabupaten: 'Cakrawana',
  kecamatan: 'Wiralaksana',
  desa: 'Wibawamukti',
  alamatDesa: 'Jl. Raya Wibawamukti No. 01, Wiralaksana',
  nama: '',
  nik: '',
  email: '',
  telepon: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'Laki-laki',
  pekerjaan: '',
  alamat: '',
  keperluan: 'Persyaratan bantuan sosial / administrasi kependudukan',
  judulSurat: 'Surat Keterangan Tidak Mampu',
  narasiSurat: 'Bahwa nama tersebut di atas adalah benar-benar penduduk Desa {desa} yang menurut pengamatan kami termasuk dalam golongan keluarga ekonomi tidak mampu (Keluarga Pra Sejahtera).',
  tanggalSurat: new Date().toISOString().split('T')[0],
  namaKades: 'NAFIS BASKARA',
  jabatanKades: 'KEPALA DESA WIBAWAMUKTI',
  ahliWaris: [],
  saksi: [],
  pendidikan: [],
  pengalaman: [],
  keahlian: [],
  logoKabupaten: '', // Base64 or URL
  detailObjek: '',
  hargaJualBeli: '',
  perusahaanTujuan: '',
  posisiDilamar: '',
  tujuanPerjalanan: '',
  tanggalBerangkat: '',
  tanggalKembali: '',
  kendaraan: 'Kendaraan Dinas / Umum',
  bebanAnggaran: 'Dana Desa / APBDes',
};
