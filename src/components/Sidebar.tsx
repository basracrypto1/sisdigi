import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FilePlus, 
  Archive, 
  Settings,
  X,
  Heart,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';

export type PageId = 'dashboard' | 'warga' | 'buat-surat' | 'arsip' | 'settings';

interface Props {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<Props> = ({ activePage, onPageChange, isOpen, onClose, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Statistik & Ringkasan' },
    { id: 'buat-surat', label: 'Buat Surat', icon: FilePlus, desc: 'Generator Dokumen AI' },
    { id: 'warga', label: 'Data Warga', icon: Users, desc: 'Direktori Penduduk' },
    { id: 'arsip', label: 'Diterbitkan', icon: Archive, desc: 'Surat Terbit' },
    { id: 'settings', label: 'Pengaturan', icon: Settings, desc: 'Konfigurasi Sistem' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-72 bg-white border-r border-line flex flex-col transition-transform duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-line">
          <div className="flex flex-col">
            <h1 className="font-display text-2xl leading-none font-black text-ink tracking-tight uppercase">
              SIS<span className="text-accent underline decoration-accent/20 decoration-2 underline-offset-2">DIGI</span>
            </h1>
            <p className="text-[7px] uppercase tracking-[3px] font-bold text-ink/30 font-heading">SISTEM SURAT DIGITAL</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-ink/20 hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 no-scrollbar">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id as PageId);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-accent text-white shadow-xl shadow-accent/20' 
                    : 'text-ink/40 hover:bg-bg hover:text-ink'}
                `}
              >
                <div className={`
                  p-2.5 rounded-xl transition-colors
                  ${isActive ? 'bg-white/10' : 'bg-bg group-hover:bg-white'}
                `}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[11px] font-black uppercase tracking-[2px] font-heading">{item.label}</span>
                  <span className={`text-[8px] font-medium uppercase tracking-widest ${isActive ? 'text-white/60' : 'text-ink/20'}`}>
                    {item.desc}
                  </span>
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-8 border-t border-line space-y-6">
          <div className="bg-bg/50 rounded-2xl p-4 border border-line">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-accent animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-accent">Status Sistem</span>
                <span className="text-[10px] font-bold text-ink">Online & Aman</span>
              </div>
            </div>
            <button className="w-full py-2.5 bg-white border border-line rounded-xl text-[9px] font-black uppercase tracking-[2px] text-ink/40 hover:text-accent hover:border-accent transition-all flex items-center justify-center gap-2">
              <MessageSquare className="w-3 h-3" /> BANTUAN
            </button>
          </div>

          <div className="flex flex-col items-center opacity-30 gap-1 text-center">
            <span className="text-[7px] uppercase tracking-[3px] font-bold">Digitalization by</span>
            <span className="text-[9px] font-bold text-ink transition-colors underline decoration-accent/20 uppercase tracking-widest leading-relaxed">
              FAHRUL ANAM <br/> DESA CAKRAWANA
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
