export function generateLetterNumber(counter: number) {
  const now = new Date();
  const year = now.getFullYear();
  const sequence = counter.toString().padStart(3, '0');
  return `${sequence}/WBW/433.313.02/${year}`;
}

export function formatDateIndo(dateString: string) {
  if (!dateString) return "....................";
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return "....................";
  }

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function getTodayISODate() {
  return new Date().toISOString().split('T')[0];
}

export function formatRupiah(value: string | number) {
  if (!value) return '';
  const numStr = value.toString().replace(/[^0-9]/g, '');
  if (!numStr) return '';
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function getRandomProfile() {
  const profiles = [
    {
      nama: 'BUDI SANTOSO',
      nik: '3510101010880001',
      tempatLahir: 'MALANG',
      tanggalLahir: '1988-10-10',
      jenisKelamin: 'Laki-laki' as const,
      pekerjaan: 'Petani / Wiraswasta',
      alamat: 'Dsn. Krajan RT 001 RW 002, Desa Maju Jaya, Kec. Sukorejo, Kab. Malang'
    },
    {
      nama: 'SITI AMINAH',
      nik: '3509124405920002',
      tempatLahir: 'SURABAYA',
      tanggalLahir: '1992-05-15',
      jenisKelamin: 'Perempuan' as const,
      pekerjaan: 'Ibu Rumah Tangga',
      alamat: 'Jl. Merdeka No. 45, RT 010 RW 003, Kel. Kebonsari, Kec. Jambangan, Kota Surabaya'
    },
    {
      nama: 'AHMAD HIDAYAT',
      nik: '3201021203850005',
      tempatLahir: 'BANDUNG',
      tanggalLahir: '1985-03-12',
      jenisKelamin: 'Laki-laki' as const,
      pekerjaan: 'Buruh Harian Lepas',
      alamat: 'Gg. Saluyu IV No. 22, RT 05 RW 01, Kel. Cicadas, Kec. Cibeunying Kidul, Kota Bandung'
    },
    {
      nama: 'DEWI SARTIKA',
      nik: '3171015111950003',
      tempatLahir: 'JAKARTA',
      tanggalLahir: '1995-11-11',
      jenisKelamin: 'Perempuan' as const,
      pekerjaan: 'Karyawan Swasta',
      alamat: 'Jl. Melati No. 104, RT 002 RW 008, Kel. Tebet Tim., Kec. Tebet, Kota Jakarta Selatan'
    },
    {
      nama: 'SUPARMAN',
      nik: '3374011207700001',
      tempatLahir: 'SEMARANG',
      tanggalLahir: '1970-07-12',
      jenisKelamin: 'Laki-laki' as const,
      pekerjaan: 'Pensiunan PNS',
      alamat: 'Jl. Gajah Mada No. 12, RT 01 RW 02, Kel. Kembangsari, Kec. Semarang Tengah, Kota Semarang'
    }
  ];
  return profiles[Math.floor(Math.random() * profiles.length)];
}

export function toSentenceCase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}
