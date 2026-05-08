import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ClipboardCheck, ShieldCheck, Map as MapIcon, Users, ChevronRight, ArrowRight, Coins } from 'lucide-react';
import IndonesiaHeatmap from '../components/IndonesiaHeatmap';

export default function LandingPage() {
  const [realTimeBudget, setRealTimeBudget] = useState({
    yearly: 0,
    monthly: 0,
    daily: 0,
    hourly: 0
  });

  useEffect(() => {
    const calculateBudget = () => {
      const now = new Date();
      
      // Constants
      const YEARLY_TOTAL = 335_000_000_000_000;
      const DAYS_IN_YEAR = 365;
      const DAILY_TOTAL = YEARLY_TOTAL / DAYS_IN_YEAR;
      const HOURLY_TOTAL = DAILY_TOTAL / 24;
      const MINUTELY_TOTAL = HOURLY_TOTAL / 60;
      const SECONDLY_TOTAL = MINUTELY_TOTAL / 60;

      // Start of periods
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

      // Elapsed seconds
      const elapsedYear = (now.getTime() - startOfYear.getTime()) / 1000;
      const elapsedMonth = (now.getTime() - startOfMonth.getTime()) / 1000;
      const elapsedDay = (now.getTime() - startOfDay.getTime()) / 1000;
      const elapsedHour = (now.getTime() - startOfHour.getTime()) / 1000;

      setRealTimeBudget({
        yearly: elapsedYear * SECONDLY_TOTAL,
        monthly: elapsedMonth * SECONDLY_TOTAL,
        daily: elapsedDay * SECONDLY_TOTAL,
        hourly: elapsedHour * SECONDLY_TOTAL
      });
    };

    const timer = setInterval(calculateBudget, 100);
    calculateBudget();
    return () => clearInterval(timer);
  }, []);

  const formatIDR = (val: number) => {
    if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(4)} Triliun`;
    if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} Miliar`;
    if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(1)} Juta`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const budgetItems = [
    { label: 'Terpakai (YTD)', value: formatIDR(realTimeBudget.yearly), detail: 'Akumulasi Thn 2024' },
    { label: 'Bulan Ini', value: formatIDR(realTimeBudget.monthly), detail: 'Berjalan Real-time' },
    { label: 'Hari Ini', value: formatIDR(realTimeBudget.daily), detail: 'Kebutuhan Harian' },
    { label: 'Jam Ini', value: formatIDR(realTimeBudget.hourly), detail: 'Kebutuhan per Jam' },
  ];

  const stats = [
    { label: 'Laporan', value: '14K+', color: 'text-primary-sky' },
    { label: 'Sekolah', value: '3.8K', color: 'text-secondary-blue' },
    { label: 'SPPG', value: '850+', color: 'text-success-green' },
    { label: 'Provinsi', value: '34', color: 'text-warning-yellow' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-surface">
      {/* Mobile Frame Simulation */}
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden border-x border-outline-variant/30">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-outline-variant h-14 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-primary-sky flex items-center justify-center text-white">
                <ClipboardCheck size={14} />
             </div>
             <span className="font-bold text-base text-primary-sky">Deloken MBG</span>
          </div>
          <Link to="/login" className="text-xs font-bold text-primary-sky bg-primary-sky/10 px-4 py-1.5 rounded-full">Masuk</Link>
        </header>

        <main className="flex-1 pb-10">
          {/* Hero Section */}
          <section className="px-6 py-10 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl font-extrabold text-on-surface leading-tight tracking-tight">
                Kawal Nutrisi <br /> <span className="text-primary-sky">Generasi Bangsa</span>
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Platform mandiri pemantauan Makan Bergizi Gratis (MBG). Bantu transparansi dengan laporan harian langsung dari genggaman Anda.
              </p>
            </motion.div>

            {/* Budget Breakdown Section */}
            <section className="py-2">
              <div className="bg-primary-sky/5 border border-primary-sky/10 rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary-sky/20 flex items-center justify-center text-primary-sky">
                    <Coins size={18} />
                  </div>
                  <h2 className="text-sm font-black text-on-surface uppercase tracking-wider">Anggaran Nutrisi Bangsa</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {budgetItems.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">{item.label}</p>
                      <p className="text-[15px] font-black text-primary-sky mt-0.5 tabular-nums">{item.value}</p>
                      <p className="text-[8px] font-medium text-on-surface-variant italic mt-1">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3">
              <Link to="/submit-report" className="bg-primary-sky text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                Mulai Melapor Sekarang
                <ArrowRight size={18} />
              </Link>
              <Link to="/guidelines" className="py-4 rounded-2xl border border-outline-variant font-bold text-on-surface text-sm hover:bg-surface transition-all text-center">
                Panduan Komunitas
              </Link>
            </div>
          </section>

          {/* Stats Row */}
          <section className="px-6 py-6 bg-surface">
            <div className="grid grid-cols-4 gap-2">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-outline-variant/30 text-center flex flex-col">
                  <span className={`text-base font-black ${stat.color}`}>{stat.value}</span>
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Map Preview */}
          <section className="px-6 py-10 space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Pantau Performa Nasional</h2>
              <p className="text-xs text-on-surface-variant mt-1">Distribusi laporan kualitas MBG di 38 provinsi.</p>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden shadow-inner border border-outline-variant">
               <IndonesiaHeatmap />
            </div>
          </section>

          {/* Features Vertical */}
          <section className="px-6 py-10 space-y-8">
            <div className="space-y-4">
               <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary-sky/10 text-primary-sky flex items-center justify-center shrink-0">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Laporan Harian Praktis</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Submit laporan porsi dan kualitas makanan hanya dalam 30 detik setiap hari.</p>
                  </div>
               </div>
               
               <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-secondary-blue/10 text-secondary-blue flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Audit SPPG Real-Time</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">Nilai performa penyedia layanan gizi secara objektif berdasarkan fakta lapangan.</p>
                  </div>
               </div>
            </div>
          </section>
        </main>

        <footer className="px-6 py-8 border-t border-outline-variant bg-surface text-center space-y-4">
           <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">© 2024 Deloken MBG App</p>
           <div className="flex justify-center gap-6 text-[10px] font-bold text-primary-sky">
              <a href="#">Privasi</a>
              <a href="#">Kontak</a>
           </div>
        </footer>
      </div>
    </div>
  );
}
