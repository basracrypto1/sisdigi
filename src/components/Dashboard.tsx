import React from 'react';
import { SavedLetter } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  X, TrendingUp, Calendar, FileText, PieChart as PieIcon, 
  BarChart2, Clock, CheckCircle2, LayoutDashboard, Sparkles,
  Wrench, ShieldCheck, Zap, Scissors, Calculator, Search
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  history: SavedLetter[];
  onClose: () => void;
  onStartWriting?: () => void;
  fullPage?: boolean;
}

const COLORS = ['#F27D26', '#141414', '#9e9e9e', '#E4E3E0', '#5A5A40'];

export const Dashboard: React.FC<Props> = ({ 
  history, 
  onClose, 
  onStartWriting,
  fullPage = false 
}) => {
  const [nikInput, setNikInput] = React.useState('');
  const [nikResult, setNikResult] = React.useState<{ valid: boolean; message: string } | null>(null);
  const [dateDays, setDateDays] = React.useState(30);
  
  const validateNik = () => {
    if (nikInput.length === 0) return;
    const isValid = /^\d{16}$/.test(nikInput);
    setNikResult({
      valid: isValid,
      message: isValid ? 'NIK Valid (16 Digit)' : 'NIK Tidak Valid (Harus 16 Digit Angka)'
    });
  };

  const calculateDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + Number(dateDays));
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's count
  const todayCount = history.filter(letter => {
    const letterDate = new Date(letter.updatedAt).toISOString().split('T')[0];
    return letterDate === today;
  }).length;

  // Calculate stats by type
  const typeCounts = history.reduce((acc, letter) => {
    const type = letter.type || 'admin';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name: name === 'admin' ? 'Administrasi' : 
          name === 'cv' ? 'Curriculum Vitae' : 
          name === 'job_app' ? 'Lamaran Kerja' : 
          name === 'business' ? 'Bisnis/Invoice' : 'Perjanjian/Legal',
    value
  }));

  // Calculate stats by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyData = last7Days.map(date => {
    const count = history.filter(letter => {
      const letterDate = new Date(letter.updatedAt).toISOString().split('T')[0];
      return letterDate === date;
    }).length;
    
    // Format date for display (e.g., "Apr 19")
    const d = new Date(date);
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    
    return { date: label, count };
  });

  const Content = (
    <div className={`w-full h-full flex flex-col ${fullPage ? 'p-4 sm:p-8 md:p-10' : 'p-5 sm:px-8'}`}>
      {/* Header - Compact */}
      <div className={`flex items-center justify-between mb-8 ${fullPage ? 'sm:mb-12' : 'sm:px-8 bg-bg/30 py-5 border-b border-line -mx-5 sm:-mx-8 mb-6'}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`${fullPage ? 'text-2xl sm:text-4xl' : 'text-lg'} font-black text-ink uppercase tracking-tight leading-none`}>Statistik Sistem</h2>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-[2px] font-bold text-ink/30 mt-1 font-heading">Ringkasan Aktivitas</p>
          </div>
        </div>
        {!fullPage && (
          <button 
            onClick={onClose}
            className="p-2.5 bg-white border border-line rounded-xl text-ink/40 hover:text-ink hover:border-ink transition-all shadow-sm group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}
      </div>

      {/* Content - Compact */}
      <div className={`flex-1 overflow-y-auto no-scrollbar ${fullPage ? 'pb-20' : 'pb-6'} space-y-6`}>
        {/* Top Key Stats - Smaller Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 bg-white border border-line rounded-2xl shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-accent/5 rounded-lg text-accent">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-[7px] font-black text-accent tracking-widest uppercase">HARI INI</div>
            </div>
            <p className="text-2xl font-black text-ink tracking-tighter">{todayCount}</p>
            <p className="text-[9px] font-bold text-ink/30 uppercase tracking-widest leading-none mt-1">Diterbitkan</p>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-line rounded-2xl shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-accent/5 rounded-lg text-accent">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-[7px] font-black text-ink/30 tracking-widest uppercase">TOTAL</div>
            </div>
            <p className="text-2xl font-black text-ink tracking-tighter">{history.length}</p>
            <p className="text-[9px] font-bold text-ink/30 uppercase tracking-widest leading-none mt-1">Riwayat</p>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-line rounded-2xl shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-accent/5 rounded-lg text-accent">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-[7px] font-black text-green-600 tracking-widest uppercase">RASIO</div>
            </div>
            <p className="text-2xl font-black text-ink tracking-tighter">
              {history.length > 0 ? Math.round((todayCount / history.length) * 100) : 0}%
            </p>
            <p className="text-[9px] font-bold text-ink/30 uppercase tracking-widest leading-none mt-1">Produktivitas</p>
          </div>

          <div className="p-4 sm:p-5 bg-accent text-white rounded-2xl shadow-lg shadow-accent/10 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="p-2 bg-white/20 rounded-lg text-white w-fit mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black tracking-tighter">Aktif</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Status</p>
            </div>
            <Sparkles className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10 group-hover:scale-125 transition-transform duration-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Chart - Compact */}
          <div className="p-6 bg-white border border-line rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black text-ink uppercase tracking-[2px]">Aktivitas Mingguan</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#1a1a1a30' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#1a1a1a30' }} />
                  <Tooltip cursor={{ fill: 'rgba(45, 90, 39, 0.03)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '8px' }} />
                  <Bar dataKey="count" fill="#F27D26" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Type breakdown - Compact */}
          <div className="p-6 bg-white border border-line rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <PieIcon className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black text-ink uppercase tracking-[2px]">Segmentasi Surat</h3>
            </div>
            <div className="h-[200px] w-full flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                      {typeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2 pr-2">
                {typeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-bg/30 rounded-lg border border-line/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[8px] font-bold text-ink/50 uppercase tracking-wide truncate max-w-[80px]">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-ink">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Tools - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-line rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black text-ink uppercase tracking-[2px]">Validasi NIK</h3>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                value={nikInput}
                onChange={(e) => setNikInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="16 Digit NIK..."
                className="w-full p-2.5 bg-bg border border-line rounded-xl text-xs outline-none font-bold placeholder:font-normal placeholder:opacity-30"
              />
              <button onClick={validateNik} className="w-full py-2.5 bg-ink text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] transition-all">CEK NIK</button>
              {nikResult && (
                <motion.div animate={{ opacity: 1 }} className={`p-2 rounded-lg border text-[8px] font-bold uppercase ${nikResult.valid ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                  {nikResult.message}
                </motion.div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border border-line rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black text-ink uppercase tracking-[2px]">Asisten Waktu</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2.5 bg-bg border border-line rounded-xl">
                <input type="number" value={dateDays} onChange={(e) => setDateDays(Number(e.target.value))} className="w-10 bg-transparent text-sm font-black text-ink outline-none" />
                <span className="text-[9px] font-bold text-ink/30 uppercase tracking-[2px]">Hari</span>
              </div>
              <div className="p-3.5 bg-accent/5 rounded-xl border border-dashed border-accent/20 text-center">
                <p className="text-[7px] font-bold text-accent uppercase tracking-widest mb-0.5">Estimasi:</p>
                <p className="text-sm font-black text-ink tracking-tight">{calculateDate()}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-accent text-white rounded-3xl shadow-lg shadow-accent/5 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" />
                <h3 className="text-[10px] font-black uppercase tracking-[2px]">Smart AI</h3>
              </div>
              <p className="text-[10px] font-medium leading-relaxed opacity-80 mb-4 line-clamp-2">Percepat draf surat dengan asisten AI kependudukan.</p>
              <button 
                onClick={fullPage ? onStartWriting : onClose} 
                className="mt-auto py-2.5 px-4 bg-white text-accent rounded-xl text-[9px] font-black uppercase tracking-[2px] transition-all"
              >
                MULAI MENULIS
              </button>
            </div>
            <Wrench className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
          </div>
        </div>
        
        {/* Recent Activity Mini List - Most Compact */}
        <div className="p-6 bg-bg/50 border border-line rounded-3xl">
           <div className="flex items-center gap-3 mb-5">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black text-ink uppercase tracking-[2px]">Aktivitas Terkini</h3>
           </div>
           
           <div className="space-y-2">
              {history.slice(-3).reverse().map((letter, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-line rounded-xl hover:border-accent/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bg group-hover:bg-accent/5 rounded-lg flex items-center justify-center text-ink/20 group-hover:text-accent transition-all">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-ink uppercase tracking-tight truncate">{letter.judulSurat}</p>
                      <p className="text-[8px] font-bold text-ink/30 uppercase tracking-widest">{new Date(letter.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-bg rounded text-[7px] font-black uppercase tracking-widest text-ink/30">
                     {letter.type === 'admin' ? 'Desa' : letter.type.toUpperCase()}
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
      
      {/* Footer Credit - Minimal */}
      <div className="py-4 bg-white border-t border-line flex justify-center opacity-30">
        <p className="text-[7px] font-black uppercase tracking-[3px]">FAHRUL ANAM • ALPHA RELEASE 2.0</p>
      </div>
    </div>
  );

  if (fullPage) {
    return Content;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 10 }}
        className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative"
      >
        {Content}
      </motion.div>
    </motion.div>
  );
};
