import React from 'react';
import { LetterData } from '../types';
import { formatDateIndo, formatRupiah } from '../lib/utils';
import { Edit3, Mail, Phone, MapPin, GraduationCap, Briefcase, Award, User } from 'lucide-react';

interface Props {
  data: LetterData;
  onUpdate?: (data: Partial<LetterData>) => void;
  onSwitchToEdit?: (section?: string) => void;
}

export const LetterPreview: React.FC<Props> = ({ data, onUpdate, onSwitchToEdit }) => {
  const handleInlineEdit = (field: keyof LetterData, value: string) => {
    if (onUpdate) {
      let finalValue = value;
      if (field === 'hargaJualBeli') {
        finalValue = formatRupiah(value);
      }
      onUpdate({ [field]: finalValue });
    }
  };

  const sanitizeValue = (val: any): string => {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val)) || val === 'null' || val === 'undefined') {
      return '';
    }
    return String(val);
  };

  const EditableSpan = ({ field, value, bold, italic, uppercase, className }: { field: keyof LetterData, value: any, bold?: boolean, italic?: boolean, uppercase?: boolean, className?: string }) => {
    const displayValue = sanitizeValue(value);
    return (
      <span
        contentEditable={!!onUpdate}
        suppressContentEditableWarning
        onBlur={(e) => handleInlineEdit(field, e.currentTarget.textContent || '')}
        className={`
          ${onUpdate ? 'cursor-text hover:bg-accent/5 focus:bg-accent/10 focus:outline-none focus:ring-1 focus:ring-accent/20 rounded px-0.5 transition-all' : ''}
          ${bold ? 'font-bold' : ''}
          ${italic ? 'italic' : ''}
          ${uppercase ? 'uppercase' : ''}
          ${className || ''}
        `}
      >
        {displayValue}
      </span>
    );
  };

  const EditableDiv = ({ field, value, className, placeholder }: { field: keyof LetterData, value: any, className?: string, placeholder?: string }) => {
    const rawValue = sanitizeValue(value);
    const text = rawValue.replace(/{desa}/g, data.desa || '');
    return (
      <div
        contentEditable={!!onUpdate}
        suppressContentEditableWarning
        onBlur={(e) => handleInlineEdit(field, e.currentTarget.textContent || '')}
        className={`
          ${onUpdate ? 'cursor-text hover:bg-accent/5 focus:bg-accent/10 focus:outline-none focus:ring-1 focus:ring-accent/20 rounded p-1 transition-all' : ''}
          ${className || ''}
        `}
      >
        {text || placeholder}
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon, sectionId }: { title: string, icon: any, sectionId?: string }) => (
    <div className="flex items-center justify-between mb-3 border-b border-line pb-1 group/header">
      <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent">
        <Icon className="w-4 h-4" /> {title}
      </h3>
      {onSwitchToEdit && (
        <button 
          onClick={() => onSwitchToEdit(sectionId)}
          className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-accent/10 text-accent rounded transition-all"
          title="Edit bagian ini"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const AdminLayout = () => (
    <div className="space-y-6">
      <div className="relative text-center border-b-[3px] border-double border-ink pb-2 mb-8 group/header">
        {data.logoKabupaten && (
          <div className="absolute left-0 top-0 h-24 w-24 flex items-center justify-center">
            <img src={data.logoKabupaten} alt="Logo" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
          </div>
        )}
        <h3 className="text-[14pt] font-bold uppercase">Pemerintah Kabupaten <EditableSpan field="kabupaten" value={data.kabupaten} /></h3>
        <h3 className="text-[14pt] font-bold uppercase">Kecamatan <EditableSpan field="kecamatan" value={data.kecamatan} /></h3>
        <h2 className="text-[14pt] font-extrabold uppercase mt-1">Desa <EditableSpan field="desa" value={data.desa} /></h2>
        <p className="text-[11pt] mt-2 opacity-80 font-sans italic"><EditableSpan field="alamatDesa" value={data.alamatDesa} /></p>
        
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('umum')}
            className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-2 bg-accent text-white rounded-full shadow-lg hover:scale-110 transition-all z-20"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-center mb-10 group/header relative">
        <h1 className="text-[14pt] font-bold underline uppercase"><EditableSpan field="judulSurat" value={data.judulSurat} /></h1>
        <p className="text-[12pt] mt-1">Nomor: <EditableSpan field="nomorSurat" value={data.nomorSurat || '...'} /></p>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('umum')}
            className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="group/header relative">
        <p className="indent-[1.25cm]">Kepala Desa <EditableSpan field="desa" value={data.desa} />, Kecamatan <EditableSpan field="kecamatan" value={data.kecamatan} />, Kabupaten <EditableSpan field="kabupaten" value={data.kabupaten} />, menerangkan bahwa:</p>
        <div className="pl-10">
          <table className="w-full">
            <tbody>
              <tr><td className="w-[180px] py-1">Nama Lengkap</td><td className="w-[10px]">:</td><td className="uppercase"><EditableSpan field="nama" value={data.nama} /></td></tr>
              <tr><td className="py-1">NIK</td><td>:</td><td><EditableSpan field="nik" value={data.nik} /></td></tr>
              <tr><td className="py-1">Tempat, Tgl Lahir</td><td>:</td><td><EditableSpan field="tempatLahir" value={data.tempatLahir} />, {formatDateIndo(data.tanggalLahir)}</td></tr>
              <tr><td className="py-1">Jenis Kelamin</td><td>:</td><td>{data.jenisKelamin}</td></tr>
              <tr><td className="py-1">Pekerjaan</td><td>:</td><td><EditableSpan field="pekerjaan" value={data.pekerjaan} /></td></tr>
              <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td><EditableSpan field="alamat" value={data.alamat} /></td></tr>
            </tbody>
          </table>
        </div>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('penduduk')}
            className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="group/header relative">
        <EditableDiv field="narasiSurat" value={data.narasiSurat} className="indent-[1.25cm] text-justify mb-4" />
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('isi')}
            className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Detail Jual Beli / Objek if relevant */}
      {(data.detailObjek || data.hargaJualBeli) && (
        <div className="pl-10 space-y-2 mb-4 group/header relative">
          {data.detailObjek && (
            <div className="flex gap-4">
              <span className="w-44 font-medium opacity-70">Detail / Batas Objek</span>
              <span>: <EditableSpan field="detailObjek" value={data.detailObjek} /></span>
            </div>
          )}
          {data.hargaJualBeli && (
            <div className="flex gap-4">
              <span className="w-44 font-medium opacity-70">Nilai Transaksi</span>
              <span>: Rp <EditableSpan field="hargaJualBeli" value={data.hargaJualBeli} /></span>
            </div>
          )}
          {onSwitchToEdit && (
            <button 
              onClick={() => onSwitchToEdit('jual_beli')}
              className="absolute -top-2 -right-4 opacity-0 group-hover/header:opacity-100 p-1 bg-accent/10 text-accent rounded-full transition-all"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Pihak Terkait / Ahli Waris */}
      {data.ahliWaris.length > 0 && (
        <div className="mb-6 group/header relative">
          <p className="mb-2">Berikut adalah pihak-pihak terkait:</p>
          <div className="pl-4">
            <table className="w-full border-collapse border border-ink text-sm">
              <thead>
                <tr className="bg-ink/5">
                  <th className="border border-ink p-1 w-10">No</th>
                  <th className="border border-ink p-1">Nama</th>
                  <th className="border border-ink p-1">NIK</th>
                  <th className="border border-ink p-1 text-center">Hubungan / Peran</th>
                </tr>
              </thead>
              <tbody>
                {data.ahliWaris.map((h, i) => (
                   <tr key={i}>
                    <td className="border border-ink p-2 text-center italic">{i + 1}</td>
                    <td className="border border-ink p-2 uppercase">{h.nama}</td>
                    <td className="border border-ink p-2 font-mono text-xs">{h.nik}</td>
                    <td className="border border-ink p-2 text-center">{h.hubungan || h.peran}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {onSwitchToEdit && (
            <button 
              onClick={() => onSwitchToEdit('waris_saksi')}
              className="absolute -top-6 -right-4 opacity-0 group-hover/header:opacity-100 p-2 bg-accent/20 text-accent rounded-full transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Saksi-Saksi */}
      {data.saksi.length > 0 && (
        <div className="mb-6 group/header relative">
          <p className="mb-2 italic">Saksi-Saksi:</p>
          <div className="pl-10 space-y-1">
            {data.saksi.map((s, i) => (
              <p key={i}>{i+1}. {s.nama} ({s.jabatan})</p>
            ))}
          </div>
          {onSwitchToEdit && (
            <button 
              onClick={() => onSwitchToEdit('waris_saksi')}
              className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      
      <p className="indent-[1.25cm]">Surat ini untuk keperluan: <EditableSpan field="keperluan" value={data.keperluan} italic />.</p>
      <p className="indent-[1.25cm]">Demikian surat ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>

      {/* Signatures for Witnesses if any */}
      {data.saksi.length > 0 && (
        <div className="grid grid-cols-2 gap-10 mt-10">
          <div className="space-y-12">
            <p className="text-center font-bold">Saksi I</p>
            <p className="text-center border-b border-ink/40 w-48 mx-auto pb-1 uppercase font-bold text-xs">{data.saksi[0]?.nama}</p>
          </div>
          <div className="space-y-12">
            <p className="text-center font-bold">Saksi II</p>
            <p className="text-center border-b border-ink/40 w-48 mx-auto pb-1 uppercase font-bold text-xs">{data.saksi[1]?.nama || '...................'}</p>
          </div>
        </div>
      )}

      <div className="mt-16 flex justify-end">
        <div className="text-center min-w-[250px]">
          <p><EditableSpan field="desa" value={data.desa} />, {formatDateIndo(data.tanggalSurat)}</p>
          <p className="font-bold underline uppercase mb-20"><EditableSpan field="jabatanKades" value={data.jabatanKades} /></p>
          <p className="font-bold underline uppercase italic"><EditableSpan field="namaKades" value={data.namaKades} /></p>
        </div>
      </div>
    </div>
  );

  const JobLayout = () => (
    <div className="font-serif">
      <div className="flex justify-between items-start mb-12 group/header relative">
        <div className="space-y-1">
          <p className="font-bold text-xl uppercase tracking-wider"><EditableSpan field="nama" value={data.nama} /></p>
          <p className="text-sm opacity-60"><EditableSpan field="alamat" value={data.alamat} /></p>
          <div className="flex gap-4 text-xs mt-2">
             <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> <EditableSpan field="email" value={data.email} /></span>
             <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> <EditableSpan field="telepon" value={data.telepon} /></span>
          </div>
        </div>
        <div className="text-right">
          <p>{data.alamat?.split(',')[0]}, {formatDateIndo(data.tanggalSurat)}</p>
        </div>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('penduduk')}
            className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="mb-8 group/header relative">
        <p className="font-bold">Perihal: Lamaran Pekerjaan</p>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('umum')}
            className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="mb-8 space-y-1 group/header relative">
        <p>Kepada Yth,</p>
        <p>HRD Departemen</p>
        <p className="font-bold uppercase"><EditableSpan field="perusahaanTujuan" value={data.perusahaanTujuan} /></p>
        <p>Di Tempat</p>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('isi')}
            className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="mb-4">Dengan hormat,</p>
      <div className="group/header relative">
        <p className="indent-[1.25cm] text-justify mb-4">Sesuai dengan informasi yang saya dapatkan, saya bermaksud untuk mengajukan lamaran pekerjaan di <EditableSpan field="perusahaanTujuan" value={data.perusahaanTujuan} /> untuk posisi sebagai <EditableSpan field="posisiDilamar" value={data.posisiDilamar} />. Adapun data diri singkat saya:</p>
        
        <div className="pl-10 mb-6 font-sans text-[10pt]">
          <table className="w-full">
            <tbody>
              <tr><td className="w-[140px] py-1">Nama</td><td className="w-[10px]">:</td><td><EditableSpan field="nama" value={data.nama} /></td></tr>
              <tr><td className="py-1">TTL</td><td>:</td><td><EditableSpan field="tempatLahir" value={data.tempatLahir} />, {formatDateIndo(data.tanggalLahir)}</td></tr>
              <tr><td className="py-1">No. Telp</td><td>:</td><td><EditableSpan field="telepon" value={data.telepon} /></td></tr>
              <tr><td className="py-1">Email</td><td>:</td><td><EditableSpan field="email" value={data.email} /></td></tr>
              <tr><td className="py-1">Pendidikan</td><td>:</td><td>{data.pendidikan[0]?.gelar || '-'}</td></tr>
              <tr><td className="py-1">Alamat</td><td>:</td><td><EditableSpan field="alamat" value={data.alamat} /></td></tr>
            </tbody>
          </table>
        </div>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('penduduk')}
            className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="group/header relative">
        <EditableDiv field="narasiSurat" value={data.narasiSurat} className="indent-[1.25cm] text-justify mb-8" />
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('isi')}
            className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>
      
      <p className="mb-12">Besar harapan saya untuk dapat bergabung. Atas perhatiannya saya ucapkan terima kasih.</p>
      
      <div className="text-right pr-12">
        <p className="mb-20">Hormat saya,</p>
        <p className="font-bold underline uppercase"><EditableSpan field="nama" value={data.nama} /></p>
      </div>
    </div>
  );

  const CVLayout = () => (
    <div className="font-sans text-ink">
      <div className="text-center mb-10 border-b-2 border-ink pb-6 group/header relative">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2"><EditableSpan field="nama" value={data.nama} /></h1>
        <div className="flex justify-center gap-6 text-sm flex-wrap opacity-70">
          <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> <EditableSpan field="email" value={data.email} /></span>
          <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> <EditableSpan field="telepon" value={data.telepon} /></span>
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> <EditableSpan field="alamat" value={data.alamat} /></span>
        </div>
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('penduduk')}
            className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-2 bg-accent text-white rounded-full shadow-lg hover:scale-110 transition-all z-20"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-1 space-y-8">
          <section>
            <SectionHeader title="Profil Personal" icon={User} sectionId="isi" />
            <EditableDiv field="narasiSurat" value={data.narasiSurat} className="text-[10pt] leading-relaxed text-ink/80" />
          </section>

          <section>
            <SectionHeader title="Keahlian" icon={Award} sectionId="cv_detail" />
            <div className="space-y-2">
              {data.keahlian.map((s, i) => (
                <div key={i} className="flex justify-between items-center bg-ink/5 p-2 rounded">
                  <span className="text-[10pt] font-bold">{s.nama}</span>
                  <span className="text-[8pt] text-accent uppercase font-black">{s.level}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-2 space-y-8 border-l border-line pl-10">
          <section>
            <SectionHeader title="Pengalaman Kerja" icon={Briefcase} sectionId="cv_detail" />
            <div className="space-y-6">
              {data.pengalaman.map((exp, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-accent/20">
                  <p className="font-bold text-lg leading-tight">{exp.posisi}</p>
                  <p className="text-accent font-bold text-sm mb-1">{exp.perusahaan}</p>
                  <p className="text-[9pt] opacity-50 italic mb-2">{exp.durasi}</p>
                  <p className="text-[10pt] text-ink/70 leading-relaxed">{exp.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Pendidikan" icon={GraduationCap} sectionId="cv_detail" />
            <div className="space-y-4">
              {data.pendidikan.map((edu, i) => (
                <div key={i}>
                  <p className="font-bold">{edu.gelar}</p>
                  <p className="text-sm text-ink/60">{edu.institusi} | {edu.tahun}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const SPPDLayout = () => (
    <div className="font-serif text-sm">
      <h1 className="text-center text-xl font-bold underline mb-8">SURAT PERINTAH PERJALANAN DINAS (SPPD)</h1>
      
      <div className="mb-8 pl-8 group/header relative border-l-2 border-line">
        <p className="mb-4 font-bold text-accent uppercase tracking-widest text-[10px]">I. Pemberi Perintah</p>
        <table className="w-full mb-6">
          <tbody>
            <tr><td className="w-48 py-1">Pejabat Berwenang</td><td className="w-4">:</td><td className="font-bold">{data.namaKades}</td></tr>
            <tr><td className="py-1">Jabatan</td><td>:</td><td>{data.jabatanKades}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="mb-8 pl-8 group/header relative border-l-2 border-line">
        <p className="mb-4 font-bold text-accent uppercase tracking-widest text-[10px]">II. Penerima Perintah</p>
        <table className="w-full mb-6">
          <tbody>
            <tr><td className="w-48 py-1">Nama / NIK</td><td className="w-4">:</td><td><span className="underline"><EditableSpan field="nama" value={data.nama} /></span> / <EditableSpan field="nik" value={data.nik} /></td></tr>
            <tr><td className="py-1">Pangkat / Jabatan</td><td>:</td><td><EditableSpan field="pekerjaan" value={data.pekerjaan} /></td></tr>
          </tbody>
        </table>
        {onSwitchToEdit && (
          <button onClick={() => onSwitchToEdit('penduduk')} className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-2 bg-accent/10 text-accent rounded-full transition-all"><Edit3 className="w-4 h-4" /></button>
        )}
      </div>

      <div className="mb-8 pl-8 group/header relative border-l-2 border-line">
        <p className="mb-4 font-bold text-accent uppercase tracking-widest text-[10px]">III. Rincian Perjalanan</p>
        <table className="w-full mb-6 italic">
          <tbody>
            <tr><td className="w-48 py-1">Maksud Perjalanan</td><td className="w-4">:</td><td><EditableSpan field="keperluan" value={data.keperluan} /></td></tr>
            <tr><td className="py-1">Tempat Tujuan</td><td>:</td><td><EditableSpan field="tujuanPerjalanan" value={data.tujuanPerjalanan} /></td></tr>
            <tr><td className="py-1">Alat Transportasi</td><td>:</td><td><EditableSpan field="kendaraan" value={data.kendaraan} /></td></tr>
            <tr><td className="py-1">Beban Anggaran</td><td>:</td><td><EditableSpan field="bebanAnggaran" value={data.bebanAnggaran} /></td></tr>
            <tr><td className="py-1">Tanggal Berangkat</td><td>:</td><td>{formatDateIndo(data.tanggalBerangkat)}</td></tr>
            <tr><td className="py-1">Tanggal Kembali</td><td>:</td><td>{formatDateIndo(data.tanggalKembali)}</td></tr>
          </tbody>
        </table>
        {onSwitchToEdit && (
          <button onClick={() => onSwitchToEdit('sppd_detail')} className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-2 bg-accent/10 text-accent rounded-full transition-all"><Edit3 className="w-4 h-4" /></button>
        )}
      </div>

      <div className="mb-12 group/header relative">
        <p className="font-bold italic mb-2">Instruksi / Catatan Tambahan:</p>
        <EditableDiv field="narasiSurat" value={data.narasiSurat} className="pl-8 text-justify leading-relaxed" />
        {onSwitchToEdit && (
          <button onClick={() => onSwitchToEdit('isi')} className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-2 bg-accent/10 text-accent rounded-full transition-all"><Edit3 className="w-4 h-4" /></button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-10 mt-20 pt-10 border-t border-line">
        <div className="text-center">
          <p className="mb-24">Pejabat Berwenang,</p>
          <p className="font-bold underline uppercase">{data.namaKades}</p>
          <p className="text-[10px] opacity-50 uppercase">{data.jabatanKades}</p>
        </div>
        <div className="text-center">
          <p>{data.desa}, {formatDateIndo(data.tanggalSurat)}</p>
          <p className="mb-20 font-bold">Penerima Perintah,</p>
          <p className="font-bold underline uppercase"><EditableSpan field="nama" value={data.nama} /></p>
        </div>
      </div>
    </div>
  );

  const AgreementLayout = () => {
    return (
      <div className="font-serif">
        <div className="text-center mb-12 group/header relative">
          <h1 className="text-[16pt] font-bold underline uppercase mb-2">
            <EditableSpan field="judulSurat" value={data.judulSurat} />
          </h1>
          <p className="text-[11pt]">Nomor: <EditableSpan field="nomorSurat" value={data.nomorSurat || '...'} /></p>
          {onSwitchToEdit && (
            <button 
              onClick={() => onSwitchToEdit('umum')}
              className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-6 group/header relative">
           <div className="text-justify leading-relaxed whitespace-pre-wrap">
             <EditableDiv field="narasiSurat" value={data.narasiSurat} />
           </div>
           {onSwitchToEdit && (
            <button 
              onClick={() => onSwitchToEdit('isi')}
              className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-10">
          <div className="text-center">
            <p className="mb-24">PIHAK PERTAMA</p>
            <p className="font-bold underline uppercase">( ............................ )</p>
          </div>
          <div className="text-center">
            <p className="mb-24">PIHAK KEDUA</p>
            <p className="font-bold underline uppercase">( ............................ )</p>
          </div>
        </div>

        {data.narasiSurat.includes('PIHAK KETIGA') && (
           <div className="mt-12 flex justify-center">
             <div className="text-center min-w-[200px]">
                <p className="mb-24">PIHAK KETIGA</p>
                <p className="font-bold underline uppercase">( ............................ )</p>
             </div>
           </div>
        )}

        <div className="mt-20 pt-10 border-t border-line text-center text-[10px] opacity-40 uppercase tracking-widest font-bold">
           <p>Dibuat dan ditandatangani pada tanggal {formatDateIndo(data.tanggalSurat)}</p>
        </div>
      </div>
    );
  };

  return (
    <div 
      key={`${data.type}-${data.judulSurat}-${data.nama}`}
      id="printable-letter"
      className="bg-paper p-12 shadow-2xl rounded-sm border border-line min-h-[297mm] mx-auto w-[210mm] relative group printable-content"
      style={{
        backgroundImage: 'linear-gradient(to bottom, transparent 296.8mm, rgba(0,0,0,0.05) 296.8mm, rgba(0,0,0,0.05) 297mm, transparent 297mm)',
        backgroundSize: '100% 297mm'
      }}
    >
      {onUpdate && (
        <div className="absolute top-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-40 transition-opacity text-[10px] text-ink uppercase tracking-widest font-bold z-10">
          <Edit3 className="w-3 h-3" /> Klik teks untuk mengedit langsung
        </div>
      )}

      {data.type === 'cv' ? <CVLayout /> : 
       data.type === 'job_application' ? <JobLayout /> : 
       data.type === 'sppd' ? <SPPDLayout /> : 
       data.type === 'agreement' ? <AgreementLayout /> :
       <AdminLayout />}
    </div>
  );
};
