export interface Heir {
  nama: string;
  nik: string;
  hubungan: string;
  peran?: string; // e.g., 'Penjual', 'Pembeli', 'Penerima'
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: 'Laki-laki' | 'Perempuan';
  pekerjaan?: string;
  alamat?: string;
}

export interface Witness {
  nama: string;
  jabatan: string;
}

export interface Education {
  sekolah: string;
  periode: string;
  jurusan: string;
  deskripsi: string;
}

export interface Experience {
  perusahaan: string;
  periode: string;
  posisi: string;
  deskripsi: string;
}

export interface LineItem {
  deskripsi: string;
  kuantitas: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
}

export interface LetterData {
  id: string;
  type: 'admin' | 'cv' | 'job_app' | 'business';
  nomorSurat: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamatDesa: string;
  nama: string;
  nik: string;
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
  items: LineItem[];
  logoKabupaten: string;
  paperSize: 'a4' | 'legal' | 'letter';
  detailObjek?: string; // Specific for Land/Property sales
  luasTanah?: string; // New
  batasUtara?: string; // New
  batasSelatan?: string; // New
  batasTimur?: string; // New
  batasBarat?: string; // New
  hargaJualBeli?: string; // Specific for sales
  penerima?: string; // Recipient for invitations (Kepada Yth)
  lampiran?: string; // Enclosures
  tembusan?: string; // Carbon copy list at bottom
  memo?: string; // Auto-generated short summary/memo
  // CV & Job App specific
  email?: string;
  telepon?: string;
  linkedin?: string;
  portofolio?: string;
  pendidikan?: Education[];
  pengalaman?: Experience[];
  keahlian?: string[];
  perusahaanTujuan?: string;
  posisiTujuan?: string;
  spreadsheetId?: string;
  googleSheetEnabled?: boolean;
  googleAppScriptUrl?: string;
}

export interface SavedLetter extends LetterData {
  updatedAt: string;
}

export interface Citizen {
  id: string;
  nama: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  pekerjaan: string;
  alamat: string;
  updatedAt: string;
}

export const INITIAL_DATA: LetterData = {
  id: crypto.randomUUID(),
  type: 'admin',
  nomorSurat: '',
  kabupaten: 'Bangkalan',
  kecamatan: 'Tanah Merah',
  desa: 'Tanah Merah Laok',
  alamatDesa: 'Jl. Raya Desa Tanah Merah Laok, Tanah Merah',
  nama: '',
  nik: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'Laki-laki',
  pekerjaan: '',
  alamat: '',
  keperluan: 'Persyaratan bantuan sosial / administrasi kependudukan',
  judulSurat: 'Surat Keterangan Tidak Mampu',
  narasiSurat: 'Bahwa nama tersebut di atas adalah benar-benar penduduk Desa {desa} yang menurut pengamatan kami termasuk dalam golongan keluarga ekonomi tidak mampu (Keluarga Pra Sejahtera).',
  tanggalSurat: new Date().toISOString().split('T')[0],
  namaKades: 'AZMY HAFIDZ HARIRI, SE',
  jabatanKades: 'Kepala Desa',
  ahliWaris: [],
  saksi: [],
  items: [],
  logoKabupaten: '', // Base64 or URL
  paperSize: 'legal',
  detailObjek: '',
  luasTanah: '',
  batasUtara: '',
  batasSelatan: '',
  batasTimur: '',
  batasBarat: '',
  hargaJualBeli: '',
  penerima: '',
  lampiran: '',
  tembusan: '',
  memo: '',
  email: '',
  telepon: '',
  linkedin: '',
  portofolio: '',
  pendidikan: [],
  pengalaman: [],
  keahlian: [],
  perusahaanTujuan: '',
  posisiTujuan: '',
  spreadsheetId: '',
  googleSheetEnabled: false,
};
