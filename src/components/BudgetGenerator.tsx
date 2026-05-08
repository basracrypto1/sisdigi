import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Sparkles, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Trash2, 
  Plus, 
  RotateCcw, 
  History, 
  Copy, 
  Check, 
  Save,
  Loader2,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

import { generateRabAI } from '../services/rabAI';
import { syncRabToSheet } from '../services/sheets';

interface RabItem {
  id?: string;
  nama_item: string;
  qty: number;
  satuan: string;
  harga_satuan: number;
  subtotal: number;
}

interface RabData {
  judul: string;
  total_anggaran: number;
  jenis: string;
  items: RabItem[];
}

interface HistoryItem {
  timestamp: string;
  data: RabData;
}

export const BudgetGenerator: React.FC = () => {
  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState('Pembangunan');
  const [anggaran, setAnggaran] = useState('');
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const [keterangan, setKeterangan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<RabData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rab_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (data: RabData) => {
    const newItem = { timestamp: new Date().toLocaleString('id-ID'), data };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('rab_history', JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!judul || !anggaran || Number(anggaran) <= 0) {
      setError('Harap isi judul dan total anggaran yang valid.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const data = await generateRabAI({
        judul,
        jenis,
        total_anggaran: Number(anggaran),
        keterangan,
        level
      });

      const itemsWithIds = data.items.map((item: RabItem, idx: number) => ({ 
        ...item, 
        id: Date.now() + idx.toString() 
      }));
      const finalData = { ...data, items: itemsWithIds };
      setResult(finalData);
      saveToHistory(finalData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleEditItem = (id: string, field: keyof RabItem, value: any) => {
    if (!result) return;
    const newItems = result.items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'harga_satuan') {
          updated.subtotal = Number(updated.qty) * Number(updated.harga_satuan);
        }
        return updated;
      }
      return item;
    });
    setResult({ ...result, items: newItems });
  };

  const handleDeleteItem = (id: string) => {
    if (!result) return;
    setResult({ ...result, items: result.items.filter(i => i.id !== id) });
  };

  const handleAddItem = () => {
    if (!result) return;
    const newItem: RabItem = {
      id: Date.now().toString(),
      nama_item: 'Item Baru',
      qty: 1,
      satuan: 'Pcs',
      harga_satuan: 0,
      subtotal: 0
    };
    setResult({ ...result, items: [...result.items, newItem] });
  };

  const totalActual = result?.items.reduce((sum, item) => sum + item.subtotal, 0) || 0;

  const saveToSheets = async () => {
    if (!result) return;
    setIsGenerating(true);
    setError(null);
    try {
      await syncRabToSheet(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      setError('Gagal simpan ke Google Sheets: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF() as any;
    
    // Header SISDIGI
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('SISDIGI - SISTEM SURAT DIGITAL', 105, 10, { align: 'center' });
    doc.text('DESA TANAH MERAH LAOK', 105, 14, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RINCIAN ANGGARAN BIAYA (RAB) AI', 105, 25, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Judul Kegiatan: ${result.judul}`, 14, 40);
    doc.text(`Jenis Kegiatan: ${result.jenis}`, 14, 47);
    doc.text(`Total Anggaran Disiapkan: ${formatCurrency(result.total_anggaran)}`, 14, 54);
    doc.text(`Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}`, 14, 61);

    const body = result.items.map((item, idx) => [
      idx + 1,
      item.nama_item,
      item.qty,
      item.satuan,
      formatCurrency(item.harga_satuan),
      formatCurrency(item.subtotal)
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['No', 'Item Rincian', 'Qty', 'Satuan', 'Harga Satuan', 'Subtotal']],
      body: body,
      foot: [['', 'TOTAL AKHIR (REALISASI)', '', '', '', formatCurrency(totalActual)]],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    // Simple Footer
    const finalY = (doc as any).lastAutoTable.finalY || 200;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by SISDIGI AI Engine', 14, finalY + 10);

    doc.save(`RAB-${result.judul.replace(/\s+/g, '-')}.pdf`);
  };

  const exportExcel = () => {
    if (!result) return;
    const worksheet = XLSX.utils.json_to_sheet(result.items.map((item, idx) => ({
      No: idx + 1,
      Item: item.nama_item,
      Qty: item.qty,
      Satuan: item.satuan,
      'Harga Satuan': item.harga_satuan,
      Subtotal: item.subtotal
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RAB");
    XLSX.writeFile(workbook, `RAB-${result.judul}.xlsx`);
  };

  const exportWord = async () => {
    if (!result) return;

    const rows = result.items.map((item, idx) => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph((idx + 1).toString())] }),
        new TableCell({ children: [new Paragraph(item.nama_item)] }),
        new TableCell({ children: [new Paragraph(item.qty.toString())] }),
        new TableCell({ children: [new Paragraph(item.satuan)] }),
        new TableCell({ children: [new Paragraph(formatCurrency(item.harga_satuan))] }),
        new TableCell({ children: [new Paragraph(formatCurrency(item.subtotal))] }),
      ]
    }));

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("No")] }),
            new TableCell({ children: [new Paragraph("Item")] }),
            new TableCell({ children: [new Paragraph("Qty")] }),
            new TableCell({ children: [new Paragraph("Satuan")] }),
            new TableCell({ children: [new Paragraph("Harga Satuan")] }),
            new TableCell({ children: [new Paragraph("Subtotal")] }),
          ]
        }),
        ...rows,
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("TOTAL")], columnSpan: 5 }),
            new TableCell({ children: [new Paragraph(formatCurrency(totalActual))] }),
          ]
        })
      ]
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: "RINCIAN ANGGARAN BIAYA", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph(`Judul: ${result.judul}`),
          new Paragraph(`Jenis: ${result.jenis}`),
          new Paragraph(`Total Dana: ${formatCurrency(result.total_anggaran)}`),
          new Paragraph(""),
          table
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `RAB-${result.judul}.docx`);
  };

  const copyToProposal = () => {
    if (!result) return;
    const text = `RAB: ${result.judul}\nTotal: ${formatCurrency(totalActual)}\n\nRincian:\n` + 
      result.items.map(i => `- ${i.nama_item}: ${i.qty} ${i.satuan} @${formatCurrency(i.harga_satuan)} = ${formatCurrency(i.subtotal)}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 sm:p-10 space-y-8 bg-bg overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <Calculator className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-ink uppercase tracking-tight leading-none">AI Rincian Anggaran</h2>
            <p className="text-[10px] font-bold text-ink/40 uppercase tracking-[2px] mt-1">Estimasi RAB Otomatis berbasis Kecerdasan Buatan</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-paper border border-line rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/30 uppercase tracking-widest ml-1">Judul Kegiatan</label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-red-500 transition-colors" />
                  <input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: HUT RI ke-79"
                    className="w-full bg-bg border border-line focus:border-red-500 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-ink transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-ink/30 uppercase tracking-widest ml-1">Jenis Kegiatan</label>
                  <select 
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                    className="w-full bg-bg border border-line focus:border-red-500 rounded-2xl py-3.5 px-4 text-xs font-bold text-ink transition-all outline-none appearance-none"
                  >
                    <option>Pembangunan</option>
                    <option>Event/Acara</option>
                    <option>Operasional</option>
                    <option>Pengadaan Barang</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-ink/30 uppercase tracking-widest ml-1">Total Dana (Rp)</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="number"
                      value={anggaran}
                      onChange={(e) => setAnggaran(e.target.value)}
                      placeholder="Nominal"
                      className="w-full bg-bg border border-line focus:border-red-500 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-ink transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/30 uppercase tracking-widest ml-1">Tingkat Detail AI</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: 'Singkat' },
                    { val: 2, label: 'Standar' },
                    { val: 3, label: 'Rinci' }
                  ].map((l) => (
                    <button
                      key={l.val}
                      onClick={() => setLevel(l.val as 1 | 2 | 3)}
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        level === l.val 
                          ? 'bg-red-500 border-red-500 text-white shadow-sm' 
                          : 'bg-bg border-line text-ink/40 hover:border-red-200'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-ink/30 uppercase tracking-widest ml-1">Deskripsi Tambahan</label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Opsional: tambahkan detail kebutuhan..."
                  rows={3}
                  className="w-full bg-bg border border-line focus:border-red-500 rounded-2xl p-4 text-xs font-bold text-ink transition-all outline-none resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-ink/10 text-white rounded-2xl py-4 font-black text-[11px] uppercase tracking-[3px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-red-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    MENGHITUNG...
                  </>
                ) : (
                  <>
                    GENERATE RINCIAN AI
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
              <button 
                onClick={() => { setJudul(''); setAnggaran(''); setKeterangan(''); setResult(null); }}
                className="w-full bg-paper hover:bg-bg border border-line text-ink/40 rounded-2xl py-3 font-black text-[9px] uppercase tracking-[2px] transition-all"
              >
                RESET SEMUA
              </button>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-paper border border-line rounded-[2.5rem] p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-ink uppercase tracking-[3px] flex items-center gap-2">
                  <History className="w-3 h-3" />
                  RIWAYAT TERAKHIR
                </h3>
              </div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                        setResult(h.data);
                        setJudul(h.data.judul);
                        setAnggaran(h.data.total_anggaran.toString());
                        setJenis(h.data.jenis);
                    }}
                    className="w-full p-4 bg-bg border border-line hover:border-red-500 rounded-2xl text-left transition-all group"
                  >
                    <p className="text-[10px] font-black text-ink uppercase truncate">{h.data.judul}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">{h.timestamp}</p>
                      <ChevronRight className="w-3 h-3 text-ink/20 group-hover:text-red-500 transition-all group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Output */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[600px] bg-paper/50 border border-line border-dashed rounded-[3rem] flex flex-col items-center justify-center text-center p-10"
              >
                <div className="w-20 h-20 bg-bg rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                  <TrendingUp className="w-10 h-10 text-ink/10" />
                </div>
                <h3 className="text-lg font-black text-ink uppercase tracking-tight">Belum Ada Estimasi</h3>
                <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[2px] mt-2 max-w-sm">
                  Masukkan data anggaran di panel kiri untuk mulai membuat rincian biaya otomatis oleh AI.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-paper border border-line rounded-[3rem] p-8 sm:p-10 shadow-sm space-y-8"
              >
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-[2px] rounded-full">
                      BERITA ACARA RAB AI
                    </span>
                    <h3 className="text-2xl font-black text-ink uppercase tracking-tight mt-2">{result.judul}</h3>
                    <p className="text-[10px] font-bold text-ink/40 uppercase tracking-[3px] mt-1">Target Anggaran: {formatCurrency(result.total_anggaran)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyToProposal}
                      className="p-3 bg-bg border border-line hover:border-red-500 rounded-2xl text-ink/40 hover:text-red-500 transition-all flex items-center gap-2 group"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-[9px] font-black uppercase tracking-widest pr-1">Copy</span>
                    </button>
                    <button 
                      onClick={saveToSheets}
                      disabled={isGenerating}
                      className="p-3 bg-green-500 text-white rounded-2xl hover:brightness-110 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                    >
                       {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                       <span className="text-[9px] font-black uppercase tracking-widest pr-1">Sync ke Sheets</span>
                    </button>
                    <button 
                      onClick={() => {
                        saveToHistory(result);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-3 bg-red-500 text-white rounded-2xl hover:brightness-110 shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                    >
                       {copied ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                       <span className="text-[9px] font-black uppercase tracking-widest pr-1">
                         {copied ? 'Tersimpan' : 'Simpan Draft'}
                       </span>
                    </button>
                  </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto border border-line rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg border-b border-line">
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest text-center w-12">No</th>
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest">Item Rincian</th>
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest text-center w-20">Qty</th>
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest text-center w-24">Satuan</th>
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest text-right">Harga Satuan</th>
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest text-right">Subtotal</th>
                        <th className="p-4 text-[9px] font-black text-ink/40 uppercase tracking-widest text-center w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {result.items.map((item, idx) => (
                        <tr key={item.id} className="group hover:bg-bg transition-colors">
                          <td className="p-4 text-[10px] font-bold text-ink/40 text-center">{idx + 1}</td>
                          <td className="p-4">
                            <input 
                              value={item.nama_item}
                              onChange={(e) => handleEditItem(item.id!, 'nama_item', e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-ink"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleEditItem(item.id!, 'qty', Number(e.target.value))}
                              className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-ink text-center"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              value={item.satuan}
                              onChange={(e) => handleEditItem(item.id!, 'satuan', e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-ink text-center"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end">
                              <span className="text-[10px] font-bold text-ink/20 mr-1">Rp</span>
                              <input 
                                type="number"
                                value={item.harga_satuan}
                                onChange={(e) => handleEditItem(item.id!, 'harga_satuan', Number(e.target.value))}
                                className="w-24 bg-transparent border-none outline-none text-[11px] font-bold text-ink text-right"
                              />
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-[11px] font-black text-ink">{formatCurrency(item.subtotal)}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleDeleteItem(item.id!)}
                                className="p-2 text-red-500/40 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Summary Row */}
                      <tr className="bg-bg font-black">
                        <td colSpan={5} className="p-6 text-[10px] uppercase tracking-[3px] text-ink/40 text-right">JUMLAH TOTAL</td>
                        <td className="p-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-sm ${Math.abs(totalActual - result.total_anggaran) < 1 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(totalActual)}
                            </span>
                          </div>
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                  <button 
                    onClick={handleAddItem}
                    className="w-full p-4 bg-bg text-[9px] font-black uppercase text-ink/30 hover:text-red-500 transition-colors flex items-center justify-center gap-2 border-t border-line"
                  >
                    <Plus className="w-4 h-4" /> TAMBAH BARIS MANUVAL
                  </button>
                </div>

                {/* Validation Info */}
                <div className="flex items-center gap-4 p-5 bg-bg border border-line rounded-3xl">
                  <div className={`p-3 rounded-2xl ${Math.abs(totalActual - result.total_anggaran) < 1 ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-ink uppercase tracking-wider">
                      {Math.abs(totalActual - result.total_anggaran) < 1 ? 'Anggaran Seimbang' : 'Selisih Anggaran'}
                    </p>
                    <p className="text-[9px] font-bold text-ink/30 uppercase tracking-[2px] mt-1">
                      {Math.abs(totalActual - result.total_anggaran) < 1 
                        ? 'Total rincian sudah sesuai dengan target dana.' 
                        : `Terdapat selisih sebesar ${formatCurrency(totalActual - result.total_anggaran)}`}
                    </p>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-1 px-4 bg-bg border border-line rounded-2xl flex items-center gap-4">
                    <span className="text-[8px] font-black text-ink/20 uppercase tracking-[2px]">EXPORT:</span>
                    <button 
                      onClick={exportPDF}
                      className="p-3 text-red-500 hover:scale-110 transition-transform" 
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={exportWord}
                      className="p-3 text-blue-500 hover:scale-110 transition-transform" 
                      title="Download Word"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={exportExcel}
                      className="p-3 text-green-500 hover:scale-110 transition-transform" 
                      title="Download Excel"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleGenerate()}
                    className="ml-auto text-[9px] font-black uppercase text-ink/30 hover:text-red-500 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" /> RE-GENERATE AI
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
