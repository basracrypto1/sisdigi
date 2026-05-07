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
  ImageRun,
  HeadingLevel
} from 'docx';
import { saveAs } from 'file-saver';
import { LetterData } from '../types';
import { formatDateIndo, formatRupiah } from './utils';

export const generateWordLetter = async (data: LetterData) => {
  let sectionChildren: any[] = [];

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

  // Routing based on type with error safety
  try {
    switch (data.type) {
      case 'business':
        sectionChildren = await generateBusinessContent(data, logoImage);
        break;
      case 'cv':
        sectionChildren = await generateCvContent(data);
        break;
      case 'job_app':
        sectionChildren = await generateJobAppContent(data);
        break;
      default:
        sectionChildren = await generateAdminContent(data, logoImage);
    }
  } catch (error) {
    console.error("Content generation failed:", error);
    sectionChildren = [new Paragraph({ children: [new TextRun("Error generating document content.")] })];
  }

  const paperTWIPs = {
    a4: { width: 11906, height: 16838 },
    legal: { width: 12240, height: 20160 },
    letter: { width: 12240, height: 15840 }
  };
  const currentTWIPs = paperTWIPs[data.paperSize || 'a4'];

  const doc = new Document({
    creator: "Sistem Digital Desa",
    description: data.judulSurat,
    title: data.judulSurat,
    lastModifiedBy: "Sistem Digital Desa",
    revision: 1,
    sections: [{ 
      properties: { 
        page: { 
          size: { width: currentTWIPs.width, height: currentTWIPs.height }, 
          margin: { 
            top: 510,     // 0.9cm
            right: 1134,   // 2cm
            bottom: 1134,  // 2cm
            left: 1440    // 2.54cm
          } 
        } 
      }, 
      children: sectionChildren 
    }]
  });

  const blob = await Packer.toBlob(doc);
  const safeJudul = data.judulSurat.trim().replace(/\s+/g, '_').substring(0, 30);
  const safeNama = (data.nama || 'Arsip').trim().replace(/\s+/g, '_').substring(0, 20);
  const fileName = `${safeJudul}_${safeNama}.docx`.replace(/[^a-zA-Z0-9._-]/g, '');
  
  saveAs(blob, fileName);
};

// --- Specialized Content Generators ---

async function generateAdminContent(data: LetterData, logoImage: any) {
  const children: any[] = [];

  // Header Table
  children.push(
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
              children: logoImage 
                ? [new Paragraph({ children: [logoImage], alignment: AlignmentType.CENTER })] 
                : [new Paragraph({ children: [] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `PEMERINTAH KABUPATEN ${data.kabupaten.toUpperCase()}`, bold: true, size: 28, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `KECAMATAN ${data.kecamatan.toUpperCase()}`, bold: true, size: 30, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `DESA ${data.desa.toUpperCase()}`, bold: true, size: 36, font: "Bookman Old Style" })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.alamatDesa, size: 18, font: "Bookman Old Style", italics: true })] }),
              ],
            }),
            new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [] })] }),
          ],
        }),
      ],
    }),
    new Paragraph({ border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 24 } }, children: [] }),
    new Paragraph({ border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }, children: [] }),
    new Paragraph({ children: [new TextRun("")] }),
  );

  const isFormal = !!(data.penerima || data.lampiran || (data.judulSurat && data.judulSurat.toUpperCase().includes('UNDANGAN')));

  if (isFormal) {
    children.push(
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
                width: { size: 60, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Nomor", size: 24, font: "Bookman Old Style" }), new TextRun({ text: `\t: ${data.nomorSurat}`, size: 24, font: "Bookman Old Style" })] }),
                  new Paragraph({ children: [new TextRun({ text: "Lampiran", size: 24, font: "Bookman Old Style" }), new TextRun({ text: `\t: ${data.lampiran || '-'}`, size: 24, font: "Bookman Old Style" })] }),
                  new Paragraph({ children: [new TextRun({ text: "Hal", bold: true, size: 24, font: "Bookman Old Style" }), new TextRun({ text: `\t: `, bold: true, size: 24, font: "Bookman Old Style" }), new TextRun({ text: data.judulSurat, bold: true, italics: true, size: 24, font: "Bookman Old Style" })] }),
                ]
              }),
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${data.desa}, ${formatDateIndo(data.tanggalSurat)}`, size: 24, font: "Bookman Old Style" })] })
                ]
              })
            ]
          })
        ]
      }),
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun({ text: "Kepada Yth :", bold: true, size: 24, font: "Bookman Old Style" })] }),
      ...data.penerima?.split('\n').map(p => new Paragraph({ children: [new TextRun({ text: p, bold: true, size: 24, font: "Bookman Old Style" })] })) || [],
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun({ text: "Dengan hormat,", italics: true, size: 24, font: "Bookman Old Style" })] }),
      new Paragraph({ children: [new TextRun("")] }),
    );
  } else {
    children.push(
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.judulSurat.toUpperCase(), bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Nomor: ${data.nomorSurat}`, size: 24, font: "Bookman Old Style" })] }),
      new Paragraph({ children: [new TextRun("")] }),
    );
  }

  // Personal Info Section
  if (data.nama || data.nik) {
    if (!isFormal) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          children: [
            new TextRun({ 
              text: `Kepala Desa ${data.desa}, Kecamatan ${data.kecamatan}, Kabupaten ${data.kabupaten}, menerangkan dengan sebenarnya bahwa:`, 
              size: 24, 
              font: "Bookman Old Style" 
            })
          ],
          spacing: { after: 200 }
        })
      );
    }

    children.push(
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
          createDataRow("Nama Lengkap", data.nama.toUpperCase()),
          createDataRow("NIK", data.nik),
          createDataRow("Tempat, Tgl Lahir", `${data.tempatLahir}, ${formatDateIndo(data.tanggalLahir)}`),
          createDataRow("Jenis Kelamin", data.jenisKelamin),
          createDataRow("Pekerjaan", data.pekerjaan),
          createDataRow("Alamat", data.alamat),
        ],
      }),
      new Paragraph({ children: [new TextRun("")] })
    );
  } else if (!isFormal && data.ahliWaris && data.ahliWaris.length >= 2) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ 
            text: `Kepala Desa ${data.desa}, Kecamatan ${data.kecamatan}, Kabupaten ${data.kabupaten}, menerangkan bahwa pada hari ini telah diadakan kesepakatan antara pihak-pihak di bawah ini:`, 
            size: 24, 
            font: "Bookman Old Style" 
          })
        ],
        spacing: { after: 200 }
      })
    );
  }

  // Narasi
  const paragraphs = data.narasiSurat.replace(/{desa}/g, data.desa).split('\n');
  paragraphs.forEach((p, idx) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        indent: { firstLine: 720 },
        children: [new TextRun({ text: p.trim(), size: 24, font: "Bookman Old Style" })],
        spacing: { after: 200 }
      })
    );
  });

  // Object/Sales Details
  if (data.detailObjek || data.hargaJualBeli || data.luasTanah || data.batasUtara) {
    const objectRows = [
      ...(data.detailObjek ? [createDataRow("Detail", data.detailObjek)] : []),
      ...(data.hargaJualBeli ? [createDataRow("Nilai Transaksi", `Rp. ${data.hargaJualBeli}`)] : []),
      ...(data.luasTanah ? [createDataRow("Luas Tanah", data.luasTanah)] : []),
    ];

    if (data.batasUtara || data.batasSelatan || data.batasTimur || data.batasBarat) {
      objectRows.push(createDataRow("", "")); // Spacer
      objectRows.push(createDataRow("Batas-Batas Tanah:", ""));
      if (data.batasUtara) objectRows.push(createDataRow("- Utara", data.batasUtara));
      if (data.batasSelatan) objectRows.push(createDataRow("- Selatan", data.batasSelatan));
      if (data.batasTimur) objectRows.push(createDataRow("- Timur", data.batasTimur));
      if (data.batasBarat) objectRows.push(createDataRow("- Barat", data.batasBarat));
    }

    children.push(
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
        rows: objectRows
      }),
      new Paragraph({ children: [new TextRun("")] })
    );
  }

  // Heirs/Related parties
  if (data.ahliWaris && data.ahliWaris.length > 0) {
    data.ahliWaris.forEach((h, i) => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `${h.peran ? h.peran.toUpperCase() : `PIHAK KE-${i + 1}`} :`, bold: true, underline: {}, size: 24, font: "Bookman Old Style" })], spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
            insideHorizontal: { style: BorderStyle.NONE, size: 0 },
            insideVertical: { style: BorderStyle.NONE, size: 0 },
          },
          rows: [
            createDataRow("Nama Lengkap", h.nama.toUpperCase()),
            createDataRow("NIK", h.nik),
            createDataRow("Tempat, Tgl Lahir", `${h.tempatLahir || '-'}, ${formatDateIndo(h.tanggalLahir || '')}`),
            createDataRow("Jenis Kelamin", h.jenisKelamin || '-'),
            createDataRow("Pekerjaan", h.pekerjaan || '-'),
            createDataRow("Alamat", h.alamat || '-'),
            ...(h.hubungan ? [createDataRow("Keterangan", h.hubungan)] : []),
          ]
        })
      );
    });
  }

  // Saksi-Saksi
  if (data.saksi && data.saksi.length > 0) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: "Saksi-Saksi:", bold: true, italics: true, size: 24, font: "Bookman Old Style" })], spacing: { before: 200, after: 100 } }),
    );
    data.saksi.forEach((s, i) => {
      children.push(
        new Paragraph({ 
          children: [new TextRun({ text: `${i + 1}. ${s.nama} (${s.jabatan})`, size: 24, font: "Bookman Old Style" })],
          indent: { left: 720 },
          spacing: { after: 100 }
        })
      );
    });
  }

  // Footer & Signature
  children.push(
    new Paragraph({
      alignment: AlignmentType.BOTH,
      indent: { firstLine: 720 },
      children: [
        new TextRun({ text: "Surat ini untuk keperluan: ", size: 24, font: "Bookman Old Style" }),
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

  // Party Signatures (Penjual/Pembeli)
  if (data.ahliWaris && data.ahliWaris.length >= 2) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          insideHorizontal: { style: BorderStyle.NONE, size: 0 },
          insideVertical: { style: BorderStyle.NONE, size: 0 },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.ahliWaris[0]?.peran?.toUpperCase() || "PIHAK I", bold: true, size: 24, font: "Bookman Old Style" })] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.ahliWaris[0]?.nama.toUpperCase() || "................", bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.ahliWaris[1]?.peran?.toUpperCase() || "PIHAK II", bold: true, size: 24, font: "Bookman Old Style" })] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.ahliWaris[1]?.nama.toUpperCase() || "................", bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
                ]
              }),
            ]
          })
        ]
      }),
      new Paragraph({ children: [new TextRun("")] })
    );
  }

  // Witness Signatures
  if (data.saksi && data.saksi.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          insideHorizontal: { style: BorderStyle.NONE, size: 0 },
          insideVertical: { style: BorderStyle.NONE, size: 0 },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAKSI I", bold: true, size: 24, font: "Bookman Old Style" })] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.saksi[0]?.nama.toUpperCase() || "................", bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
                ]
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SAKSI II", bold: true, size: 24, font: "Bookman Old Style" })] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ children: [] }),
                  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.saksi[1]?.nama.toUpperCase() || "................", bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
                ]
              }),
            ]
          })
        ]
      }),
      new Paragraph({ children: [new TextRun("")] })
    );
  }

  children.push(generateSignatureRow(data));

  if (data.tembusan) {
    children.push(
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun({ text: "Tembusan Kepada Yth :", bold: true, underline: {}, size: 20 })] }),
      ...data.tembusan.split('\n').map(t => new Paragraph({ children: [new TextRun({ text: t, italics: true, size: 20 })] }))
    );
  }

  return children;
}

async function generateBusinessContent(data: LetterData, logoImage: any) {
  const children: any[] = [];
  const totalAmount = (data.items || []).reduce((sum, item) => sum + (item.total || 0), 0);

  // Business Header (Receipt Style)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.SINGLE, size: 24 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: data.judulSurat.toUpperCase(), bold: true, size: 48, color: "2D5A27" })] }),
                new Paragraph({ children: [new TextRun({ text: `No. ${data.nomorSurat}`, size: 20, color: "666666" })] }),
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                ...(logoImage ? [new Paragraph({ alignment: AlignmentType.RIGHT, children: [logoImage] })] : []),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.nama, bold: true, size: 28 })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: data.alamat, size: 18, color: "666666" })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${data.telepon} | ${data.email}`, size: 18, color: "666666" })] }),
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 200 } })
  );

  // To & Date Section
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "DITUJUKAN KEPADA", bold: true, size: 16, color: "999999" })] }),
                new Paragraph({ children: [new TextRun({ text: data.penerima || "-", bold: true, size: 28 })] }),
                new Paragraph({ children: [new TextRun({ text: data.keperluan, size: 20, color: "666666" })] }),
              ]
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TANGGAL", bold: true, size: 16, color: "999999" })] }),
                new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatDateIndo(data.tanggalSurat), bold: true, size: 24 })] }),
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 400 } })
  );

  // Items Table
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KETERANGAN ITEM", bold: true, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JUMLAH", bold: true, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "HARGA", bold: true, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TOTAL", bold: true, size: 18 })] })] }),
          ]
        }),
        ...(data.items || []).map(item => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.deskripsi, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${item.kuantitas} ${item.satuan}`, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Rp ${formatRupiah(item.hargaSatuan)}`, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Rp ${formatRupiah(item.total)}`, bold: true, size: 20 })] })] }),
          ]
        })),
        new TableRow({
          children: [
            new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL TAGIHAN", bold: true, size: 20 })] })] }),
            new TableCell({ 
              shading: { fill: "E8F5E9" },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Rp ${formatRupiah(totalAmount)}`, bold: true, size: 24, color: "2D5A27" })] })] 
            }),
          ]
        })
      ]
    }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 400 } })
  );

  // Notes & Signature
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "CATATAN TAMBAHAN", bold: true, size: 16, color: "999999" })] }),
                ...data.narasiSurat.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, italics: true, size: 18 })] })),
              ]
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "HORMAT KAMI,", bold: true, size: 20, color: "999999" })] }),
                new Paragraph({ children: [] }),
                new Paragraph({ children: [] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.namaKades.toUpperCase(), bold: true, underline: {}, size: 24 })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.jabatanKades.toUpperCase(), size: 16, color: "999999" })] }),
              ]
            })
          ]
        })
      ]
    })
  );

  return children;
}

async function generateCvContent(data: LetterData) {
  const children: any[] = [];
  
  // CV Header
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.nama.toUpperCase(), bold: true, size: 48 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.pekerjaan.toUpperCase(), size: 24, color: "444444" })] }),
    new Paragraph({ children: [new TextRun("")], border: { bottom: { color: "666666", style: BorderStyle.SINGLE, size: 12 } } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.telepon} | ${data.email} | ${data.alamat}`, size: 18, color: "666666" })] }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 300 } })
  );

  // Profile
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "PROFIL / RINGKASAN", bold: true, size: 28, underline: {} })] }),
    new Paragraph({ children: [new TextRun({ text: data.keperluan })], spacing: { after: 200 }, alignment: AlignmentType.BOTH }),
  );

  // Experience
  if (data.pengalaman && data.pengalaman.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "PENGALAMAN KERJA", bold: true, size: 28, underline: {} })], spacing: { before: 200, after: 100 } }));
    data.pengalaman.forEach(exp => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: exp.posisi.toUpperCase(), bold: true, size: 22 }), new TextRun({ text: `\t${exp.periode}`, italics: true })] }),
        new Paragraph({ children: [new TextRun({ text: exp.perusahaan, italics: true, bold: true, color: "2D5A27" })] }),
        new Paragraph({ children: [new TextRun({ text: exp.deskripsi })], spacing: { after: 200 } })
      );
    });
  }

  // Education
  if (data.pendidikan && data.pendidikan.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "PENDIDIKAN", bold: true, size: 28, underline: {} })], spacing: { before: 200, after: 100 } }));
    data.pendidikan.forEach(edu => {
      children.push(
        new Paragraph({ children: [new TextRun({ text: edu.sekolah.toUpperCase(), bold: true, size: 22 }), new TextRun({ text: `\t${edu.periode}`, italics: true })] }),
        new Paragraph({ children: [new TextRun({ text: `${edu.jurusan} - ${edu.deskripsi}` })], spacing: { after: 100 } })
      );
    });
  }

  // Skills
  if (data.keahlian && data.keahlian.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "KEAHLIAN", bold: true, size: 28, underline: {} })], spacing: { before: 200, after: 100 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: data.keahlian.join(", "), size: 20 })] }));
  }

  return children;
}

async function generateJobAppContent(data: LetterData) {
  const children: any[] = [];

  // Job App Header (Modern Professional)
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.nama.toUpperCase(), bold: true, size: 36 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.alamat} | ${data.email} | ${data.telepon}`, size: 18, color: "666666" })] }),
    new Paragraph({ border: { bottom: { color: "000000", style: BorderStyle.SINGLE, size: 12 } }, children: [] }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 400 } })
  );

  // Recipient
  children.push(
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${data.desa}, ${formatDateIndo(data.tanggalSurat)}`, size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: "Kepada Yth:", bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: data.penerima, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: data.perusahaanTujuan })] }),
    new Paragraph({ children: [new TextRun({ text: "Di Tempat" })] }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `Perihal: Lamaran Pekerjaan - ${data.posisiTujuan}`, bold: true, underline: {} })] }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: "Dengan hormat," })] }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 200 } })
  );

  // Body
  data.narasiSurat.split('\n').forEach(p => {
    children.push(new Paragraph({ children: [new TextRun({ text: p })], alignment: AlignmentType.BOTH, indent: { firstLine: 720 }, spacing: { after: 200 } }));
  });

  children.push(
    new Paragraph({ children: [new TextRun({ text: "Demikian surat lamaran ini saya buat dengan harapan Bapak/Ibu bersedia memberikan kesempatan wawancara kepada saya. Atas perhatian dan kerjasamanya, saya ucapkan terima kasih." })], alignment: AlignmentType.BOTH, indent: { firstLine: 720 } }),
    new Paragraph({ children: [new TextRun("")], spacing: { after: 600 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Hormat saya,", italics: true })] }),
    new Paragraph({ children: [] }),
    new Paragraph({ children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.nama.toUpperCase(), bold: true, underline: {} })] })
  );

  return children;
}

// --- Helper Components ---

function createDataRow(label: string, value: string) {
  return new TableRow({ children: [new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: label, size: 24, font: "Bookman Old Style" })] })] }), new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: ":", size: 24, font: "Bookman Old Style" })] })] }), new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: value, size: 24, font: "Bookman Old Style" })] })] })] });
}

function generateSignatureRow(data: LetterData) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, size: 0 },
      insideVertical: { style: BorderStyle.NONE, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [], width: { size: 60, type: WidthType.PERCENTAGE } }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.desa}, ${formatDateIndo(data.tanggalSurat)}`, size: 24, font: "Bookman Old Style" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.jabatanKades, size: 24, font: "Bookman Old Style" })] }),
              new Paragraph({ children: [] }),
              new Paragraph({ children: [] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.namaKades.toUpperCase(), bold: true, underline: {}, size: 24, font: "Bookman Old Style" })] }),
            ],
          }),
        ],
      }),
    ],
  });
}
