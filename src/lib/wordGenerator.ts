import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  ImageRun
} from 'docx';
import { saveAs } from 'file-saver';
import { LetterData } from '../types';

export const generateWordLetter = async (data: LetterData) => {
  if (data.type === 'cv') {
    return generateCVWord(data);
  } else if (data.type === 'job_application') {
    return generateJobApplicationWord(data);
  } else if (data.type === 'sppd') {
    return generateSPPDWord(data);
  } else if (data.type === 'agreement') {
    return generateAgreementWord(data);
  } else {
    return generateAdminWord(data);
  }
};

const generateAdminWord = async (data: LetterData) => {
  const sectionChildren: any[] = [];

  let logoImage: any = null;
  if (data.logoKabupaten) {
    try {
      const resp = await fetch(data.logoKabupaten);
      const buffer = await resp.arrayBuffer();
      logoImage = new ImageRun({
        data: buffer,
        transformation: {
          width: 75,
          height: 75,
        },
      } as any);
    } catch (e) {
      console.error("Failed to fetch logo:", e);
    }
  }

  // Header Table
  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 15, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: logoImage ? [new Paragraph({ children: [logoImage], alignment: AlignmentType.CENTER })] : [],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PEMERINTAH KABUPATEN ${data.kabupaten.toUpperCase()}`, bold: true, size: 32, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `KECAMATAN ${data.kecamatan.toUpperCase()}`, bold: true, size: 32, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `DESA ${data.desa.toUpperCase()}`, bold: true, size: 24, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.alamatDesa, size: 20, font: "Bookman Old Style" })] }),
              ],
            }),
            new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [] }),
          ],
        }),
      ],
    }),
    new Paragraph({ border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 24 } }, children: [] }),
    new Paragraph({ border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }, children: [] }),
    new Paragraph({ children: [new TextRun("")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.judulSurat.toUpperCase(), bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Nomor: ${data.nomorSurat}`, size: 24, font: "Bookman Old Style" })] }),
    new Paragraph({ children: [new TextRun("")] }),
    new Paragraph({
      alignment: AlignmentType.BOTH,
      children: [new TextRun({ text: `Kepala Desa ${data.desa}, Kecamatan ${data.kecamatan}, Kabupaten ${data.kabupaten}, menerangkan dengan sebenarnya bahwa:`, size: 24, font: "Bookman Old Style" })],
      spacing: { after: 200 }
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        createDataRow("Nama Lengkap", data.nama),
        createDataRow("NIK", data.nik),
        createDataRow("Tempat, Tgl Lahir", `${data.tempatLahir}, ${formatDate(data.tanggalLahir)}`),
        createDataRow("Jenis Kelamin", data.jenisKelamin),
        createDataRow("Pekerjaan", data.pekerjaan),
        createDataRow("Alamat", data.alamat),
      ],
    }),
    new Paragraph({ children: [new TextRun("")] })
  );

  // Body Content (Narasi)
  const paragraphs = data.narasiSurat.replace(/{desa}/g, data.desa).split('\n').filter(p => p.trim() !== '');
  paragraphs.forEach((p, idx) => {
    sectionChildren.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        indent: { firstLine: idx === 0 ? 720 : 0 },
        children: [new TextRun({ text: p.trim(), size: 24, font: "Bookman Old Style" })],
        spacing: { after: 200 }
      })
    );
  });

  // Add Object Details if relevant (Land/Property sales)
  if (data.detailObjek || data.hargaJualBeli) {
    sectionChildren.push(
      new Paragraph({ children: [new TextRun("")], spacing: { after: 100 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "auto" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
          left: { style: BorderStyle.NONE, size: 0, color: "auto" },
          right: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        rows: [
          ...(data.detailObjek ? [new TableRow({
            children: [
              new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Detail Objek", bold: true, size: 24, font: "Bookman Old Style" })] })] }),
              new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Bookman Old Style" })] })] }),
              new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: data.detailObjek, size: 24, font: "Bookman Old Style" })] })] }),
            ]
          })] : []),
          ...(data.hargaJualBeli ? [new TableRow({
            children: [
              new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Nilai Transaksi", bold: true, size: 24, font: "Bookman Old Style" })] })] }),
              new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Bookman Old Style" })] })] }),
              new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `Rp. ${data.hargaJualBeli}`, size: 24, font: "Bookman Old Style" })] })] }),
            ]
          })] : []),
        ]
      })
    );
  }

  // Add relations if any
  if (data.ahliWaris && data.ahliWaris.length > 0) {
    sectionChildren.push(
      new Paragraph({ children: [new TextRun({ text: "Berikut adalah pihak-pihak terkait:", size: 24, font: "Bookman Old Style" })], spacing: { before: 200, after: 100 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nama", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NIK", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Peran/Hubungan", bold: true })] })] }),
            ]
          }),
          ...data.ahliWaris.map((h, i) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (i + 1).toString() })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.nama.toUpperCase(), bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.nik })] })] }),
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h.hubungan || h.peran || '-' })] })] }),
            ]
          }))
        ]
      })
    );
  }

  // Add Witnesses if any
  if (data.saksi && data.saksi.length > 0) {
    sectionChildren.push(
      new Paragraph({ children: [new TextRun({ text: "Saksi-Saksi:", italics: true, size: 24, font: "Bookman Old Style" })], spacing: { before: 200, after: 100 } }),
      ...data.saksi.map((s, i) => new Paragraph({
        indent: { left: 720 },
        children: [new TextRun({ text: `${i + 1}. ${s.nama} (${s.jabatan})`, size: 24, font: "Bookman Old Style" })]
      }))
    );
  }

  // Conclusion
  sectionChildren.push(
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: { firstLine: 720 },
      children: [
        new TextRun({ text: "Surat keterangan ini diberikan untuk keperluan: ", size: 24, font: "Bookman Old Style" }),
        new TextRun({ text: data.keperluan, bold: true, italics: true, size: 24, font: "Bookman Old Style" }),
      ],
      spacing: { before: 200, after: 200 }
    }),
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: { firstLine: 720 },
      children: [new TextRun({ text: "Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.", size: 24, font: "Bookman Old Style" })],
      spacing: { after: 400 }
    })
  );

  // Witness Signatures
  if (data.saksi && data.saksi.length > 0) {
    const witnessRow = new TableRow({
      children: [
        new TableCell({ 
          width: { size: 50, type: WidthType.PERCENTAGE }, 
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Saksi I", bold: true, size: 24, font: "Bookman Old Style" })] }),
            new Paragraph({ children: [new TextRun("")] }),
            new Paragraph({ children: [new TextRun("")] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.saksi[0]?.nama.toUpperCase() || '...................', bold: true, size: 24, font: "Bookman Old Style" })] }),
          ] 
        }),
        new TableCell({ 
          width: { size: 50, type: WidthType.PERCENTAGE }, 
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Saksi II", bold: true, size: 24, font: "Bookman Old Style" })] }),
            new Paragraph({ children: [new TextRun("")] }),
            new Paragraph({ children: [new TextRun("")] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.saksi[1]?.nama.toUpperCase() || '...................', bold: true, size: 24, font: "Bookman Old Style" })] }),
          ] 
        }),
      ]
    });

    sectionChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "auto" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
          left: { style: BorderStyle.NONE, size: 0, color: "auto" },
          right: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        rows: [witnessRow]
      }),
      new Paragraph({ children: [new TextRun("")], spacing: { after: 400 } })
    );
  }

  // Main Signature
  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [], width: { size: 60, type: WidthType.PERCENTAGE } }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.desa}, ${formatDate(data.tanggalSurat)}`, size: 24, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.jabatanKades, size: 24, font: "Bookman Old Style" })] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.namaKades.toUpperCase(), bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return finalizedGenerate(data, sectionChildren);
};

const generateJobApplicationWord = async (data: LetterData) => {
  const sectionChildren: any[] = [];
  sectionChildren.push(
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${data.alamat.split(',')[0]}, ${formatDate(data.tanggalSurat)}`, size: 24, font: "Times New Roman" })], spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Perihal: Lamaran Pekerjaan", size: 24, font: "Times New Roman" })], spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Kepada Yth,\nHRD Departemen\n" + (data.perusahaanTujuan || 'Pimpinan Perusahaan') + "\nDi Tempat", size: 24, font: "Times New Roman" })], spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Dengan hormat,", size: 24, font: "Times New Roman" })], spacing: { after: 200 } }),
    new Paragraph({ alignment: AlignmentType.BOTH, indent: { firstLine: 720 }, children: [new TextRun({ text: `Saya yang bertanda tangan di bawah ini bermaksud melamar posisi ${data.posisiDilamar || 'Karyawan'} di perusahaan yang Bapak/Ibu pimpin. Berikut data diri saya:`, size: 24, font: "Times New Roman" })], spacing: { after: 300 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        createDataRowFT(data.nama, "Nama"),
        createDataRowFT(`${data.tempatLahir}, ${formatDate(data.tanggalLahir)}`, "TTL"),
        createDataRowFT(data.pendidikan[0]?.gelar || '-', "Pendidikan"),
        createDataRowFT(data.telepon || '-', "Telp"),
        createDataRowFT(data.email || '-', "Email"),
      ]
    }),
    new Paragraph({ alignment: AlignmentType.BOTH, indent: { firstLine: 720 }, children: [new TextRun({ text: data.narasiSurat, size: 24, font: "Times New Roman" })], spacing: { before: 300, after: 400 } }),
    new Paragraph({ alignment: AlignmentType.BOTH, children: [new TextRun({ text: "Demikian surat lamaran ini saya buat, besar harapan saya untuk bergabung. Terima kasih.", size: 24, font: "Times New Roman" })], spacing: { after: 600 } }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Hormat saya,\n\n\n\n" + data.nama.toUpperCase(), bold: true, size: 24, font: "Times New Roman" })] })
  );
  return finalizedGenerate(data, sectionChildren);
};

const generateCVWord = async (data: LetterData) => {
  const sectionChildren: any[] = [];
  sectionChildren.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CURRICULUM VITAE", bold: true, size: 36, font: "Arial" })], spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: data.nama.toUpperCase(), bold: true, size: 28, font: "Arial" })] }),
    new Paragraph({ children: [new TextRun({ text: `${data.email} | ${data.telepon} | ${data.alamat}`, size: 18, font: "Arial" })], spacing: { after: 300 } }),
    new Paragraph({ border: { bottom: { color: "666666", size: 6, style: BorderStyle.SINGLE } }, children: [new TextRun({ text: "PROFIL PROFESIONAL", bold: true, size: 20, font: "Arial" })], spacing: { before: 200, after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: data.narasiSurat, size: 18, font: "Arial" })], spacing: { after: 200 } }),
    new Paragraph({ border: { bottom: { color: "666666", size: 6, style: BorderStyle.SINGLE } }, children: [new TextRun({ text: "PENGALAMAN KERJA", bold: true, size: 20, font: "Arial" })], spacing: { before: 200, after: 100 } }),
    ...data.pengalaman.map(exp => new Paragraph({ children: [new TextRun({ text: `${exp.posisi} - ${exp.perusahaan} (${exp.durasi})\n`, bold: true, size: 18 }), new TextRun({ text: exp.deskripsi, size: 16 })], spacing: { after: 150 } })),
    new Paragraph({ border: { bottom: { color: "666666", size: 6, style: BorderStyle.SINGLE } }, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 20, font: "Arial" })], spacing: { before: 200, after: 100 } }),
    ...data.pendidikan.map(edu => new Paragraph({ children: [new TextRun({ text: `${edu.gelar} - ${edu.institusi} (${edu.tahun})`, size: 18 })], spacing: { after: 100 } })),
    new Paragraph({ border: { bottom: { color: "666666", size: 6, style: BorderStyle.SINGLE } }, children: [new TextRun({ text: "KEAHLIAN", bold: true, size: 20, font: "Arial" })], spacing: { before: 200, after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: data.keahlian.map(s => `${s.nama} (${s.level})`).join(", "), size: 18 })] })
  );
  return finalizedGenerate(data, sectionChildren);
};

const generateSPPDWord = async (data: LetterData) => {
  const sectionChildren: any[] = [];
  
  // Custom SPPD Content with Boxed Table
  sectionChildren.push(
    new Paragraph({ 
      alignment: AlignmentType.CENTER, 
      children: [new TextRun({ text: "SURAT PERINTAH PERJALANAN DINAS", bold: true, size: 28, font: "Bookman Old Style", underline: {} })],
      spacing: { after: 100 } 
    }),
    new Paragraph({ 
      alignment: AlignmentType.CENTER, 
      children: [new TextRun({ text: `Nomor : ${data.nomorSurat}`, size: 24, font: "Bookman Old Style" })],
      spacing: { after: 400 } 
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // 1
        new TableRow({
          children: [
            new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1", bold: true, size: 22 })] })] }),
            new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Pejabat Berwenang yang memberi perintah", size: 22 })] })] }),
            new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${data.namaKades.toUpperCase()} / ${data.jabatanKades}`, bold: true, size: 22 })] })] }),
          ]
        }),
        // 2
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nama / NIP Pegawai yang diperintah", size: 22 })] })] }),
            new TableCell({ children: [
              new Paragraph({ children: [new TextRun({ text: data.nama.toUpperCase(), bold: true, underline: {}, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: `NIP: ${data.nipPenerima || '-'}`, size: 18 })] }),
            ] }),
          ]
        }),
        // 3
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "a. Pangkat dan Golongan\nb. Jabatan / Instansi", size: 22 })] })] }),
            new TableCell({ children: [
              new Paragraph({ children: [new TextRun({ text: `a. ${data.pangkatPenerima || '-'}`, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: `b. ${data.pekerjaan}`, size: 22 })] }),
            ] }),
          ]
        }),
        // 4
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Maksud Perjalanan Dinas", size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: data.keperluan, size: 22 })] })] }),
          ]
        }),
        // 5
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "5", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Alat Angkut yang dipergunakan", size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: data.kendaraan || '-', size: 22 })] })] }),
          ]
        }),
        // 6
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "6", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "a. Tempat Berangkat\nb. Tempat Tujuan", size: 22 })] })] }),
            new TableCell({ children: [
              new Paragraph({ children: [new TextRun({ text: `a. Desa ${data.desa}`, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: `b. ${data.tujuanPerjalanan || '-'}`, size: 22 })] }),
            ] }),
          ]
        }),
        // 7
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "7", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "a. Lamanya Perjalanan Dinas\nb. Tanggal Berangkat\nc. Tanggal Kembali", size: 22 })] })] }),
            new TableCell({ children: [
              new Paragraph({ children: [new TextRun({ text: `a. ${data.lamanyaPerjalanan || '-'}`, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: `b. ${formatDate(data.tanggalBerangkat || '')}`, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: `c. ${formatDate(data.tanggalKembali || '')}`, size: 22 })] }),
            ] }),
          ]
        }),
        // 8
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "8", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Pembebanan Anggaran\na. Instansi\nb. Mata Anggaran", size: 22 })] })] }),
            new TableCell({ children: [
              new Paragraph({ children: [new TextRun({ text: `a. Pemerintah Desa ${data.desa}`, size: 22 })] }),
              new Paragraph({ children: [new TextRun({ text: `b. ${data.bebanAnggaran || '-'}`, size: 22 })] }),
            ] }),
          ]
        }),
        // 9
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "9", bold: true, size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Keterangan Lain-lain", size: 22 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: data.narasiSurat, size: 22, italics: true })] })] }),
          ]
        }),
      ]
    }),

    new Paragraph({ text: "", spacing: { before: 800 } }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Penerima Perintah,", size: 24, font: "Bookman Old Style" })] }),
              new Paragraph({ children: [new TextRun("")] }),
              new Paragraph({ children: [new TextRun("")] }),
              new Paragraph({ children: [new TextRun("")] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.nama.toUpperCase(), bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
            ]}),
            new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Dikeluarkan di : ${data.desa}`, size: 22, font: "Bookman Old Style" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Pada tanggal : ${formatDate(data.tanggalSurat)}`, size: 22, font: "Bookman Old Style" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pejabat Berwenang,", bold: true, underline: {}, size: 24, font: "Bookman Old Style" })], spacing: { before: 200 } }),
              new Paragraph({ children: [new TextRun("")] }),
              new Paragraph({ children: [new TextRun("")] }),
              new Paragraph({ children: [new TextRun("")] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.namaKades.toUpperCase(), bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.jabatanKades, size: 18, font: "Bookman Old Style" })] }),
            ]}),
          ]
        })
      ]
    })
  );
  return finalizedGenerate(data, sectionChildren);
};

const generateAgreementWord = async (data: LetterData) => {
  const sectionChildren: any[] = [];
  
  sectionChildren.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.judulSurat.toUpperCase(), bold: true, underline: {}, size: 24, font: "Times New Roman" })], spacing: { after: 100 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Nomor: ${data.nomorSurat}`, size: 24, font: "Times New Roman" })], spacing: { after: 400 } }),
  );

  const agreementParagraphs = data.narasiSurat.split('\n').filter(p => p.trim() !== '');
  agreementParagraphs.forEach(p => {
    sectionChildren.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [new TextRun({ text: p.trim(), size: 24, font: "Times New Roman" })],
        spacing: { after: 400, line: 360 }
      })
    );
  });

  sectionChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ 
              width: { size: 50, type: WidthType.PERCENTAGE }, 
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PIHAK PERTAMA", bold: true, size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "( ............................ )", size: 24, font: "Times New Roman" })] }),
              ] 
            }),
            new TableCell({ 
              width: { size: 50, type: WidthType.PERCENTAGE }, 
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PIHAK KEDUA", bold: true, size: 24, font: "Times New Roman" })] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ children: [new TextRun("")] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "( ............................ )", size: 24, font: "Times New Roman" })] }),
              ] 
            }),
          ]
        })
      ]
    })
  );

  if (data.narasiSurat.includes('PIHAK KETIGA')) {
    sectionChildren.push(
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PIHAK KETIGA", bold: true, size: 24, font: "Times New Roman" })] }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "( ............................ )", size: 24, font: "Times New Roman" })] })
    );
  }

  sectionChildren.push(
    new Paragraph({ children: [new TextRun("")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Dibuat dan ditandatangani pada tanggal ${formatDate(data.tanggalSurat)}`, italics: true, size: 20, font: "Times New Roman" })], spacing: { before: 400 } })
  );

  return finalizedGenerate(data, sectionChildren);
};

const finalizedGenerate = async (data: LetterData, sectionChildren: any[]) => {
  const doc = new Document({
    creator: "SISDIGI",
    title: data.judulSurat,
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children: sectionChildren }]
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.judulSurat}_${data.nama}.docx`);
};

function createDataRow(label: string, value: string) {
  return new TableRow({ children: [new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: label, size: 24, font: "Bookman Old Style" })] })] }), new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Bookman Old Style" })] })] }), new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: value, size: 24, font: "Bookman Old Style" })] })] })] });
}

function createDataRowFT(value: string, label: string) {
  return new TableRow({ children: [new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: label, size: 24, font: "Times New Roman" })] })] }), new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Times New Roman" })] })] }), new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: value, size: 24, font: "Times New Roman" })] })] })] });
}

function formatDate(ds: string) {
  if (!ds) return "-";
  const d = new Date(ds);
  return `${d.getDate()} ${["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][d.getMonth()]} ${d.getFullYear()}`;
}
