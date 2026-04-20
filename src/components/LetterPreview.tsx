import React, { useState } from 'react';
import { LetterData } from '../types';
import { formatDateIndo, formatRupiah } from '../lib/utils';
import { Edit3, Mail, Phone, MapPin, GraduationCap, Briefcase, Award, User, Users, Share2, Copy, Check, X, Sparkles } from 'lucide-react';
import { getShareUrl } from '../lib/share';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  data: LetterData;
  onUpdate?: (data: Partial<LetterData>) => void;
  onSwitchToEdit?: (section?: string) => void;
}

export const LetterPreview: React.FC<Props> = ({ data, onUpdate, onSwitchToEdit }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = getShareUrl(data);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Draft Surat: ${data.judulSurat}`);
    const body = encodeURIComponent(`Halo,\n\nBerikut adalah draf surat "${data.judulSurat}" yang ingin saya bagikan kepada Anda.\n\nKlik tautan di bawah ini untuk melihat dan mengedit surat:\n${shareUrl}\n\nTerima kasih.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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
    
    // Prevent Enter key in single-line spans
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    };

    return (
      <span
        contentEditable={!!onUpdate}
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={(e) => handleInlineEdit(field, e.currentTarget.innerText || '')}
        className={`
          ${onUpdate ? 'min-w-[4px] inline-block cursor-text hover:bg-accent/5 focus:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 rounded px-0.5 transition-all outline-none selection:bg-accent/30' : ''}
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

  const EditableArraySpan = ({ index, field, subField, value, bold, className, type }: { 
    index: number, 
    field: 'ahliWaris' | 'saksi' | 'pendidikan' | 'pengalaman' | 'keahlian' | 'items', 
    subField?: string,
    value: any,
    bold?: boolean,
    className?: string,
    type?: string
  }) => {
    if (!onUpdate) return <span className={className}>{value}</span>;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
      const newValue = e.currentTarget.innerText;
      const array = [...(data[field] as any[])];
      
      if (subField) {
        array[index] = { ...array[index], [subField]: newValue };
      } else {
        array[index] = newValue;
      }
      
      onUpdate({ [field]: array });
    };

    return (
      <span
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`
          inline-block min-w-[10px] cursor-text hover:bg-accent/5 focus:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 rounded px-0.5 transition-all outline-none selection:bg-accent/30
          ${bold ? 'font-bold' : ''}
          ${className || ''}
        `}
      >
        {value}
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
        onBlur={(e) => handleInlineEdit(field, e.currentTarget.innerText || '')}
        className={`
          ${onUpdate ? 'cursor-text hover:bg-accent/5 focus:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/30 rounded p-1 transition-all outline-none selection:bg-accent/30' : ''}
          whitespace-pre-wrap
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
          className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-accent/10 text-accent rounded transition-all no-print"
          title="Edit bagian ini"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  const AdminLayout = () => (
    <div className="space-y-6">
      <div className="relative border-b-[4px] border-ink pb-4 mb-8 group/header">
        <div className="flex items-center justify-center">
          {/* Logo Container - Absolute to keep text centered in the whole width */}
          <div className="absolute left-0 top-0 h-24 w-24 flex items-center justify-center">
            {data.logoKabupaten && (
              <img 
                src={data.logoKabupaten} 
                alt="Logo" 
                className="max-h-[95px] w-auto object-contain" 
                referrerPolicy="no-referrer" 
              />
            )}
          </div>

          {/* Header Text Content */}
          <div className="text-center w-full px-24">
            <h3 className="text-[14pt] leading-tight font-bold uppercase tracking-wide">Pemerintah Kabupaten <EditableSpan field="kabupaten" value={data.kabupaten} /></h3>
            <h3 className="text-[15pt] leading-tight font-bold uppercase tracking-wide">Kecamatan <EditableSpan field="kecamatan" value={data.kecamatan} /></h3>
            <h2 className="text-[18pt] leading-tight font-black uppercase mt-0.5 tracking-wider font-heading">Desa <EditableSpan field="desa" value={data.desa} /></h2>
            <p className="text-[9pt] mt-1 font-sans italic tracking-tight border-t border-ink/20 pt-1 leading-relaxed"><EditableSpan field="alamatDesa" value={data.alamatDesa} /></p>
          </div>
        </div>
        
        <div className="w-full h-[1px] bg-ink mt-1.5" />
        
        {onSwitchToEdit && (
          <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover/header:opacity-100 transition-all z-20 no-print">
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 bg-paper/90 border border-line text-ink rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center"
              title="Bagikan Surat"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onSwitchToEdit('umum')}
              className="p-2 bg-accent text-white rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center"
              title="Edit Bagian Ini"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Default Title Section - Hidden if formal header has its own Hal/Nomor logic to avoid duplication */}
      {!((data.penerima || data.lampiran || (data.judulSurat && data.judulSurat.toUpperCase().includes('UNDANGAN')))) && (
        <div className="text-center mb-8 group/header relative">
          <h1 className="text-[12pt] font-bold underline uppercase underline-offset-4 decoration-2">
            <EditableSpan field="judulSurat" value={data.judulSurat} />
          </h1>
          <p className="text-[12pt] mt-1 font-normal italic">Nomor: <EditableSpan field="nomorSurat" value={data.nomorSurat || '...'} /></p>
          {onSwitchToEdit && (
            <button 
              onClick={() => onSwitchToEdit('umum')}
              className="absolute -top-4 -right-4 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all shadow-sm no-print"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Formal Header Section for Invitations/Institutional Letters */}
      {(data.penerima || data.lampiran || (data.judulSurat && data.judulSurat.toUpperCase().includes('UNDANGAN'))) && (
        <div className="mb-8 space-y-4 font-serif">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <div className="flex gap-4">
                  <span className="w-20">Nomor</span>
                  <span>: <EditableSpan field="nomorSurat" value={data.nomorSurat} /></span>
                </div>
                <div className="flex gap-4">
                  <span className="w-20">Lampiran</span>
                  <span>: <EditableSpan field="lampiran" value={data.lampiran || '-'} /></span>
                </div>
                <div className="flex gap-4">
                  <span className="w-20 font-bold">Hal</span>
                  <span className="font-bold">: <EditableSpan field="judulSurat" value={data.judulSurat} italic /></span>
                </div>
             </div>
             <div className="text-right">
                <EditableSpan field="desa" value={data.desa} />, {formatDateIndo(data.tanggalSurat)}
             </div>
          </div>

          {data.penerima && (
            <div className="mt-6 space-y-1">
              <p className="font-bold">Kepada Yth :</p>
              <EditableDiv field="penerima" value={data.penerima} className="pl-0 leading-relaxed font-bold" />
            </div>
          )}

          <div className="mt-8">
            <p className="italic">Dengan hormat,</p>
          </div>
        </div>
      )}

      <div className="group/header relative leading-relaxed mb-6">
        {/* Hide default opening if it's a formal invitation that already handled it */}
        {!(data.penerima || (data.judulSurat && data.judulSurat.toUpperCase().includes('UNDANGAN'))) && (
          <p className="text-justify indent-[1.25cm]">
            {(!data.nama && !data.nik) ? (
              <>Bahwa sehubungan dengan pelaksanaan tugas dan tanggung jawab di lingkungan Pemerintahan Desa <EditableSpan field="desa" value={data.desa} />, maka dengan ini kami informasikan hal-hal sebagai berikut:</>
            ) : (
              <>Kepala Desa <EditableSpan field="desa" value={data.desa} />, Kecamatan <EditableSpan field="kecamatan" value={data.kecamatan} />, Kabupaten <EditableSpan field="kabupaten" value={data.kabupaten} />, menerangkan dengan sebenarnya bahwa:</>
            )}
          </p>
        )}
        
        {/* Only show personal info section if name or NIK exists */}
        {(data.nama || data.nik) && (
          <div className="pl-10 mt-4">
            <table className="layout-table">
              <tbody>
                <tr><td className="w-[200px] py-1">Nama Lengkap</td><td className="w-[10px]">:</td><td className="uppercase font-bold tracking-wide"><EditableSpan field="nama" value={data.nama} /></td></tr>
                <tr><td className="py-1">NIK</td><td>:</td><td className="font-mono text-[11pt]"><EditableSpan field="nik" value={data.nik} /></td></tr>
                <tr><td className="py-1">Tempat, Tgl Lahir</td><td>:</td><td><EditableSpan field="tempatLahir" value={data.tempatLahir} />, {formatDateIndo(data.tanggalLahir)}</td></tr>
                <tr><td className="py-1">Jenis Kelamin</td><td>:</td><td>{data.jenisKelamin}</td></tr>
                <tr><td className="py-1">Pekerjaan</td><td>:</td><td><EditableSpan field="pekerjaan" value={data.pekerjaan} /></td></tr>
                <tr><td className="py-1 align-top">Alamat</td><td className="align-top">:</td><td><EditableSpan field="alamat" value={data.alamat} /></td></tr>
              </tbody>
            </table>
          </div>
        )}
        
        {onSwitchToEdit && (
          <button 
            onClick={() => onSwitchToEdit('penduduk')}
            className="absolute top-0 right-0 opacity-0 group-hover/header:opacity-100 p-1.5 bg-accent/10 text-accent rounded-full transition-all"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="group/header relative mt-6">
        <EditableDiv field="narasiSurat" value={data.narasiSurat} className="indent-[1.25cm] text-justify leading-relaxed mb-4" />
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
              <span className="w-44 font-medium opacity-70">Detail</span>
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
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="w-10">No</th>
                  <th>Nama</th>
                  <th>NIK</th>
                  <th className="text-center">Hubungan / Peran</th>
                </tr>
              </thead>
              <tbody>
                {data.ahliWaris.map((h, i) => (
                   <tr key={i}>
                    <td className="text-center italic">{i + 1}</td>
                    <td className="uppercase"><EditableArraySpan index={i} field="ahliWaris" subField="nama" value={h.nama} /></td>
                    <td className="font-mono text-xs"><EditableArraySpan index={i} field="ahliWaris" subField="nik" value={h.nik} /></td>
                    <td className="text-center"><EditableArraySpan index={i} field="ahliWaris" subField="hubungan" value={h.hubungan || h.peran} /></td>
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
            <p className="text-center border-b border-ink/40 w-48 mx-auto pb-1 uppercase font-bold text-xs">
              <EditableArraySpan index={0} field="saksi" subField="nama" value={data.saksi[0]?.nama} />
            </p>
          </div>
          <div className="space-y-12">
            <p className="text-center font-bold">Saksi II</p>
            <p className="text-center border-b border-ink/40 w-48 mx-auto pb-1 uppercase font-bold text-xs">
              <EditableArraySpan index={1} field="saksi" subField="nama" value={data.saksi[1]?.nama || '...................'} />
            </p>
          </div>
        </div>
      )}

      <div className="mt-16 flex justify-end">
        <div className="text-center min-w-[250px] inline-block break-inside-avoid-page" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <p><EditableSpan field="desa" value={data.desa} />, {formatDateIndo(data.tanggalSurat)}</p>
          <p className="font-bold underline uppercase mb-20"><EditableSpan field="jabatanKades" value={data.jabatanKades} /></p>
          <p className="font-bold underline uppercase italic"><EditableSpan field="namaKades" value={data.namaKades} /></p>
        </div>
      </div>

      {/* Tembusan section at the bottom */}
      {data.tembusan && (
        <div className="mt-10 text-[10pt] font-sans">
          <p className="font-bold underline mb-1">Tembusan Kepada Yth :</p>
          <EditableDiv field="tembusan" value={data.tembusan} className="pl-4 italic" />
        </div>
      )}
    </div>
  );


  const BusinessLayout = () => {
    const totalAmount = (data.items || []).reduce((sum, item) => sum + (item.total || 0), 0);

    return (
      <div className="space-y-8 font-sans">
        <div className="flex justify-between items-start border-b-2 border-line pb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-accent mb-2">
              <EditableSpan field="judulSurat" value={data.judulSurat} />
            </h1>
            <p className="text-sm font-bold text-ink/40 uppercase tracking-widest">No. <EditableSpan field="nomorSurat" value={data.nomorSurat} /></p>
          </div>
          <div className="text-right">
            {data.logoKabupaten && (
              <img src={data.logoKabupaten} alt="Logo" className="h-16 w-auto mb-4 ml-auto" />
            )}
            <h3 className="font-bold text-lg uppercase"><EditableSpan field="nama" value={data.nama} /></h3>
            <p className="text-sm text-ink/60 whitespace-pre-line"><EditableSpan field="alamat" value={data.alamat} /></p>
            <p className="text-sm text-ink/60">{data.telepon} | {data.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-3">Ditujukan Kepada</h4>
            <div className="space-y-1">
              <EditableDiv field="penerima" value={data.penerima} className="font-bold text-lg leading-tight p-0" />
              <p className="text-sm text-ink/60 whitespace-pre-line leading-relaxed"><EditableSpan field="keperluan" value={data.keperluan} /></p>
            </div>
          </div>
          <div className="text-right">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-3">Tanggal</h4>
            <p className="font-bold">{formatDateIndo(data.tanggalSurat)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-bg border-b border-line">
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">Keterangan Item</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-center">Jumlah</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right">Harga</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(data.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-medium">
                    <EditableArraySpan field="items" index={i} subField="deskripsi" value={item.deskripsi} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <EditableArraySpan field="items" index={i} subField="kuantitas" value={item.kuantitas} />{' '}
                    <EditableArraySpan field="items" index={i} subField="satuan" value={item.satuan} />
                  </td>
                  <td className="px-6 py-4 text-right">Rp {formatRupiah(item.hargaSatuan)}</td>
                  <td className="px-6 py-4 text-right font-bold">Rp {formatRupiah(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-accent/5 border-t border-line">
              <tr>
                <td colSpan={3} className="px-6 py-6 text-right font-black uppercase tracking-widest text-[10px]">Total Tagihan</td>
                <td className="px-6 py-6 text-right text-lg font-black text-accent">Rp {formatRupiah(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-12 pt-12">
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/40">Catatan Tambahan</h4>
             <EditableDiv field="narasiSurat" value={data.narasiSurat} className="text-sm leading-relaxed italic p-0" />
          </div>
          <div className="text-center space-y-20">
            <p className="text-sm font-bold uppercase tracking-widest text-ink/40">Hormat Kami,</p>
            <div className="space-y-1">
              <p className="font-black text-lg uppercase border-b-2 border-ink inline-block px-4 pb-1"><EditableSpan field="namaKades" value={data.namaKades} /></p>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest"><EditableSpan field="jabatanKades" value={data.jabatanKades} /></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AgreementLayout = () => (
    <div className="space-y-8 text-justify font-serif">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-2xl font-black uppercase tracking-widest underline underline-offset-8 decoration-4">
          <EditableSpan field="judulSurat" value={data.judulSurat} />
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest">Nomor: <EditableSpan field="nomorSurat" value={data.nomorSurat} /></p>
      </div>

      <p className="indent-12">
        Pada hari ini, <span className="font-bold italic uppercase">{formatDateIndo(data.tanggalSurat)}</span>, bertempat di <span className="font-bold underline underline-offset-4"><EditableSpan field="alamatDesa" value={data.alamatDesa} /></span>, kami yang bertanda tangan di bawah ini:
      </p>

      <div className="space-y-8 pl-8">
        {(data.ahliWaris || []).map((pihak, i) => (
          <div key={i} className="space-y-4">
            <h4 className="font-black uppercase tracking-tighter text-lg bg-ink text-paper px-4 py-1 inline-block -ml-8">{pihak.peran || `PIHAK KE-${i + 1}`}</h4>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="w-[180px] py-1 font-bold">Nama Lengkap</td><td className="w-[15px]">:</td><td className="uppercase font-bold"><EditableArraySpan field="ahliWaris" index={i} subField="nama" value={pihak.nama} /></td></tr>
                <tr><td className="py-1 font-bold">NIK / No. Identitas</td><td>:</td><td className="font-mono"><EditableArraySpan field="ahliWaris" index={i} subField="nik" value={pihak.nik} /></td></tr>
                <tr><td className="py-1 font-bold">Jabatan / Hubungan</td><td>:</td><td><EditableArraySpan field="ahliWaris" index={i} subField="hubungan" value={pihak.hubungan} /></td></tr>
              </tbody>
            </table>
            <p className="text-sm leading-relaxed italic border-l-4 border-accent/20 pl-4 py-1">
              Selanjutnya disebut sebagai <span className="font-bold uppercase tracking-wide">{pihak.peran || `PIHAK KE-${i + 1}`}</span>.
            </p>
          </div>
        ))}
      </div>

      <div className="pt-8 space-y-6">
        <div className="text-center font-bold uppercase tracking-widest text-sm bg-bg border-y border-line py-3">Pernyataan Kesepakatan</div>
        <EditableDiv field="narasiSurat" value={data.narasiSurat} className="indent-12 leading-loose text-justify p-0" />
      </div>

      {data.detailObjek && (
        <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[3px] text-accent">Objek Perjanjian</h4>
          <EditableDiv field="detailObjek" value={data.detailObjek} className="text-sm leading-relaxed p-0" />
        </div>
      )}

      {/* Signature Grid */}
      <div className="pt-24 space-y-24">
        <div className="grid grid-cols-2 gap-20">
          {(data.ahliWaris || []).slice(0, 2).map((pihak, i) => (
            <div key={i} className="text-center space-y-24">
              <p className="font-black uppercase tracking-widest text-[10px]">{pihak.peran || `PIHAK KE-${i + 1}`}</p>
              <div className="space-y-1">
                <p className="font-bold underline uppercase underline-offset-4 tracking-wide">{pihak.nama}</p>
              </div>
            </div>
          ))}
        </div>

        {data.saksi.length > 0 && (
          <div className="space-y-12">
            <p className="text-center font-black uppercase tracking-[5px] text-[10px] opacity-40">Saksi-Saksi</p>
            <div className={`grid grid-cols-${Math.min(data.saksi.length, 3)} gap-12`}>
              {data.saksi.map((s, i) => (
                <div key={i} className="text-center space-y-16">
                  <p className="text-[9px] font-bold uppercase tracking-widest">{s.jabatan || `Saksi ${i+1}`}</p>
                  <p className="font-bold underline underline-offset-4">( {s.nama} )</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center space-y-24 pt-12">
          <div className="text-center space-y-24">
             <p className="font-black uppercase tracking-widest text-[10px]">Mengetahui,</p>
             <div className="space-y-1">
                <p className="font-black underline uppercase underline-offset-4 tracking-widest decoration-2">{data.namaKades}</p>
                <p className="text-[8px] font-black uppercase tracking-[2px] opacity-40">{data.jabatanKades}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CvLayout = () => (
    <div className="grid grid-cols-12 h-full min-h-[inherit] bg-white">
      {/* Sidebar */}
      <div className="col-span-4 bg-emerald-950 text-paper p-8 flex flex-col gap-8 h-full min-h-[inherit]">
        {/* Profile Header in Sidebar Small Screen logic? No, this is PDF preview. */}
        <div className="space-y-2 group/header relative">
          <h1 className="text-[24pt] font-black uppercase leading-[0.9] tracking-tighter">
            <EditableSpan field="nama" value={data.nama} />
          </h1>
          <p className="text-[10pt] font-bold text-emerald-400 tracking-widest uppercase">
            <EditableSpan field="pekerjaan" value={data.pekerjaan || 'Proffesional'} />
          </p>
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('penduduk')} className="absolute -top-4 -right-4 p-1 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-6 group/header relative">
          <h3 className="text-[10pt] font-black uppercase tracking-[3px] border-b border-white/20 pb-2">Kontak</h3>
          <ul className="space-y-4 text-[9pt]">
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg"><Mail className="w-3 h-3" /></div>
              <span className="truncate"><EditableSpan field="email" value={data.email} /></span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg"><Phone className="w-3 h-3" /></div>
              <span><EditableSpan field="telepon" value={data.telepon} /></span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg"><MapPin className="w-3 h-3" /></div>
              <span className="leading-tight"><EditableSpan field="alamat" value={data.alamat} /></span>
            </li>
            <li className="flex items-center gap-3">
              <div className="p-1.5 bg-white/10 rounded-lg"><Share2 className="w-3 h-3" /></div>
              <span className="truncate underline opacity-60"><EditableSpan field="linkedin" value={data.linkedin} /></span>
            </li>
          </ul>
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('kontak')} className="absolute -top-4 -right-4 p-1 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-6 group/header relative">
          <h3 className="text-[10pt] font-black uppercase tracking-[3px] border-b border-white/20 pb-2">Keahlian</h3>
          <div className="flex flex-wrap gap-2">
            {(data.keahlian || []).map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-[8pt] font-medium tracking-wide">
                <EditableArraySpan index={i} field="keahlian" value={skill} />
              </span>
            ))}
          </div>
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('isi')} className="absolute -top-4 -right-4 p-1 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-8 p-10 flex flex-col gap-10">
        {/* Objective */}
        <div className="group/header relative">
          <h3 className="text-[12pt] font-black uppercase tracking-[4px] text-ink mb-4 border-l-4 border-emerald-900 pl-4">Objective / Summary</h3>
          <EditableDiv field="keperluan" value={data.keperluan} className="text-[10pt] leading-relaxed text-ink/70 text-justify font-medium" />
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('isi')} className="absolute top-0 right-0 p-1.5 bg-emerald-50 text-emerald-900 rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Experience */}
        <div className="group/header relative">
          <h3 className="text-[12pt] font-black uppercase tracking-[4px] text-ink mb-6 border-l-4 border-emerald-900 pl-4">Pengalaman Kerja</h3>
          <div className="space-y-8">
            {(data.pengalaman || []).map((exp, i) => (
              <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-emerald-900 before:rounded-full">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[11pt] font-black text-ink uppercase tracking-tight">
                    <EditableArraySpan index={i} field="pengalaman" subField="posisi" value={exp.posisi} />
                  </h4>
                  <span className="text-[9pt] font-bold text-ink/40 bg-line/20 px-2 py-0.5 rounded-md whitespace-nowrap ml-4">
                    <EditableArraySpan index={i} field="pengalaman" subField="periode" value={exp.periode} />
                  </span>
                </div>
                <p className="text-[10pt] font-black text-emerald-900 mb-2 italic tracking-wide">
                  <EditableArraySpan index={i} field="pengalaman" subField="perusahaan" value={exp.perusahaan} />
                </p>
                <div className="text-[9.5pt] leading-relaxed text-ink/60">
                   <EditableArraySpan index={i} field="pengalaman" subField="deskripsi" value={exp.deskripsi} className="w-full" />
                </div>
              </div>
            ))}
          </div>
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('riwayat')} className="absolute top-0 right-0 p-1.5 bg-emerald-50 text-emerald-900 rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Education */}
        <div className="group/header relative">
          <h3 className="text-[12pt] font-black uppercase tracking-[4px] text-ink mb-6 border-l-4 border-emerald-900 pl-4">Pendidikan</h3>
          <div className="space-y-6">
            {(data.pendidikan || []).map((edu, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <h4 className="text-[11pt] font-black text-ink tracking-tight uppercase">
                    <EditableArraySpan index={i} field="pendidikan" subField="sekolah" value={edu.sekolah} />
                  </h4>
                  <p className="text-[10pt] font-bold text-emerald-900 italic">
                    <EditableArraySpan index={i} field="pendidikan" subField="jurusan" value={edu.jurusan} />
                  </p>
                </div>
                <span className="text-[9pt] font-bold text-ink/40 bg-line/20 px-2 py-0.5 rounded-md whitespace-nowrap ml-4">
                  <EditableArraySpan index={i} field="pendidikan" subField="periode" value={edu.periode} />
                </span>
              </div>
            ))}
          </div>
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('riwayat')} className="absolute top-0 right-0 p-1.5 bg-emerald-50 text-emerald-900 rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const JobAppLayout = () => (
    <div className="space-y-10 font-serif">
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-ink/10 pb-6 group/header relative">
        <div className="space-y-1">
          <h1 className="text-[22pt] font-black uppercase tracking-tight text-ink"><EditableSpan field="nama" value={data.nama} /></h1>
          <p className="text-[11pt] font-bold text-accent uppercase tracking-widest"><EditableSpan field="pekerjaan" value={data.pekerjaan || 'Proffesional'} /></p>
        </div>
        <div className="text-right text-[9pt] space-y-1 text-ink/60">
          <p className="flex items-center justify-end gap-2"><MapPin className="w-3 h-3" /> <EditableSpan field="alamat" value={data.alamat} /></p>
          <p className="flex items-center justify-end gap-2"><Mail className="w-3 h-3" /> <EditableSpan field="email" value={data.email} /></p>
          <p className="flex items-center justify-end gap-2"><Phone className="w-3 h-3" /> <EditableSpan field="telepon" value={data.telepon} /></p>
        </div>
        {onSwitchToEdit && (
          <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 no-print">
            <button onClick={() => onSwitchToEdit('penduduk')} className="p-1.5 bg-accent/10 text-accent rounded-full"><Edit3 className="w-3 h-3" /></button>
            <button onClick={() => onSwitchToEdit('kontak')} className="p-1.5 bg-accent/10 text-accent rounded-full"><Users className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {/* Date & Recipient */}
      <div className="space-y-6">
        <p className="text-right">{data.desa || 'Jakarta'}, {formatDateIndo(data.tanggalSurat)}</p>
        
        <div className="space-y-1 group/header relative">
          <p className="font-bold">Kepada Yth:</p>
          <EditableDiv field="penerima" value={data.penerima} placeholder="Contoh: HRD PT. Maju Jaya" className="font-bold leading-tight" />
          <p className="font-bold"><EditableSpan field="perusahaanTujuan" value={data.perusahaanTujuan} /></p>
          <p className="italic text-ink/60 leading-tight">Di Tempat</p>
          {onSwitchToEdit && (
            <button onClick={() => onSwitchToEdit('isi')} className="absolute top-0 -right-8 p-1.5 bg-accent/10 text-accent rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <p className="font-bold underline underline-offset-4 decoration-accent/20">Perihal: Lamaran Pekerjaan - <EditableSpan field="posisiTujuan" value={data.posisiTujuan} /></p>
          <p>Dengan hormat,</p>
        </div>
      </div>

      {/* Body */}
      <div className="group/header relative">
        <EditableDiv field="narasiSurat" value={data.narasiSurat} className="indent-12 text-justify leading-relaxed" />
        {onSwitchToEdit && (
          <button onClick={() => onSwitchToEdit('isi')} className="absolute top-0 -right-8 p-1.5 bg-accent/10 text-accent rounded-full opacity-0 group-hover:opacity-100 transition-all no-print">
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="indent-12">Demikian surat lamaran ini saya buat dengan harapan Bapak/Ibu bersedia memberikan kesempatan wawancara kepada saya. Atas perhatian dan kerjasamanya, saya ucapkan terima kasih.</p>

      {/* Signature */}
      <div className="pt-10 flex flex-col items-end">
        <div className="text-center w-48 space-y-20">
          <p>Hormat saya,</p>
          <p className="font-bold underline uppercase underline-offset-4 tracking-wide"><EditableSpan field="nama" value={data.nama} /></p>
        </div>
      </div>
    </div>
  );

  const renderLayout = () => {
    switch (data.type) {
      case 'cv': return <CvLayout />;
      case 'job_app': return <JobAppLayout />;
      case 'business': return <BusinessLayout />;
      case 'agreement': return <AgreementLayout />;
      default: return <AdminLayout />;
    }
  };

  const paperDimensions = {
    a4: { w: '210mm', h: '297mm', print: 'A4' },
    legal: { w: '216mm', h: '356mm', print: 'legal' },
    letter: { w: '216mm', h: '279mm', print: 'letter' }
  };

  const currentDim = paperDimensions[data.paperSize || 'a4'];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Memo Summary Box - Outside the printable area */}
      {data.memo && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[210mm] mb-6 p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4 no-print relative overflow-hidden group/memo"
        >
          <div className="absolute right-0 top-0 p-3 opacity-10 group-hover/memo:opacity-20 transition-opacity">
            <Sparkles className="w-12 h-12 text-accent" />
          </div>
          <div className="p-2 bg-accent/10 rounded-xl text-accent">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[10px] font-black uppercase tracking-[2px] text-accent">Memo / Ringkasan Cepat</h4>
              {onSwitchToEdit && (
                <button 
                  onClick={() => onSwitchToEdit('isi')}
                  className="text-[9px] font-bold text-accent/40 hover:text-accent transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-2.5 h-2.5" /> UBAH MEMO
                </button>
              )}
            </div>
            <p className="text-xs text-ink/70 font-medium leading-relaxed italic pr-12">
              "{data.memo}"
            </p>
          </div>
        </motion.div>
      )}

      <div 
        key={`${data.type}-${data.judulSurat}-${data.nama}-${data.paperSize}`}
        id="printable-letter"
      className="bg-paper p-[25mm] shadow-2xl rounded-sm border border-line mx-auto relative group printable-content font-serif text-ink text-[12pt]"
      style={{
        width: currentDim.w,
        minHeight: currentDim.h,
        backgroundImage: `linear-gradient(to bottom, transparent calc(${currentDim.h} - 0.2mm), rgba(0,0,0,0.05) calc(${currentDim.h} - 0.2mm), rgba(0,0,0,0.05) ${currentDim.h}, transparent ${currentDim.h})`,
        backgroundSize: `100% ${currentDim.h}`
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: ${currentDim.print}; margin: 0; }
          #printable-letter {
            width: ${currentDim.w} !important;
            min-height: ${currentDim.h} !important;
            padding: 25mm !important;
            margin: 0 !important;
          }
        }
      `}} />

      {onUpdate && (
        <div className="absolute top-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-40 transition-opacity text-[10px] text-ink uppercase tracking-widest font-bold z-10 no-print">
          <Edit3 className="w-3 h-3" /> Klik teks untuk mengedit langsung
        </div>
      )}

      {renderLayout()}

      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-paper border border-line rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-line flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink">Bagikan Surat</h3>
                  <p className="text-sm text-ink/40">Bagikan draf surat ini kepada pihak lain</p>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 hover:bg-line rounded-full transition-colors text-ink/40 hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-[2px] text-ink/40 ml-1">Tautan Surat</label>
                  <div className="flex gap-2 p-1.5 bg-line/20 border border-line rounded-xl">
                    <input 
                      type="text" 
                      readOnly 
                      value={shareUrl}
                      className="flex-1 bg-transparent border-none outline-none px-3 font-sans text-sm text-ink/60 truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                        isCopied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-accent text-paper hover:bg-accent/90'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Berhasil
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Salin
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleEmailShare}
                    className="flex items-center justify-center gap-3 w-full py-3 bg-paper border border-line hover:border-accent hover:text-accent rounded-xl transition-all font-bold text-sm"
                  >
                    <Mail className="w-5 h-5" />
                    Bagikan via Email
                  </button>
                </div>

                <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                      <Share2 className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Cara Kerja</p>
                      <p className="text-[11px] text-ink/60 leading-relaxed">
                        Tautan ini berisi seluruh data surat yang sedang Anda buat. Penerima tautan dapat melihat dan mengedit kembali data tersebut secara langsung.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-line/10 border-t border-line text-center">
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-xs font-bold text-ink/40 hover:text-ink transition-colors uppercase tracking-[2px]"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
};
