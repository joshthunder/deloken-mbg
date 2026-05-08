import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Heart, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function CommunityGuidelines() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: ShieldCheck,
      title: "Integritas Laporan",
      content: "Setiap laporan harus didasarkan pada kejadian nyata di lapangan. Dilarang keras memberikan laporan palsu, manipulatif, atau bertujuan untuk menjatuhkan pihak tertentu tanpa bukti yang sah."
    },
    {
      icon: Heart,
      title: "Etika Berkualitas",
      content: "Gunakan bahasa yang sopan dan konstruktif dalam kolom komentar atau pengaduan. Hindari penggunaan kata-kata kasar, SARA, atau konten yang tidak relevan dengan program MBG."
    },
    {
      icon: ShieldAlert,
      title: "Kerahasiaan Data",
      content: "Meskipun laporan Anda anonim ke publik, sistem kami mencatat data autentik untuk divalidasi oleh admin. Jangan mencantumkan data pribadi sensitif orang lain dalam foto atau deskripsi laporan."
    },
    {
      icon: CheckCircle2,
      title: "Bukti Foto",
      content: "Foto yang diunggah harus menampilkan porsi makanan MBG yang diterima pada hari tersebut. Foto yang tidak jelas, mengandung unsur pornografi, atau kekerasan akan langsung dihapus oleh moderator."
    }
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl flex flex-col relative border-x border-outline-variant/30">
        
        {/* Header */}
        <header className="h-14 bg-white border-b border-outline-variant flex items-center px-4 sticky top-0 z-50">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-on-surface" />
          </button>
          <h1 className="ml-2 font-bold text-lg text-on-surface">Panduan Komunitas</h1>
        </header>

        <main className="flex-1 p-6 space-y-8 pb-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-primary-sky tracking-tight">Kawal Bersama dengan Jujur</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Selamat datang di komunitas Deloken MBG. Dengan menggunakan platform ini, Anda setuju untuk mengikuti standar komunitas berikut demi transparansi nasional.
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface/50 p-5 rounded-2xl border border-outline-variant/20 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-sky/10 text-primary-sky flex items-center justify-center shrink-0">
                  <section.icon size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-on-surface">{section.title}</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-5 bg-danger-red/5 border border-danger-red/10 rounded-2xl">
             <h4 className="text-xs font-black text-danger-red uppercase tracking-wider mb-2">Sanksi Pelanggaran</h4>
             <p className="text-[10px] text-on-surface-variant leading-relaxed">
               Akun yang terbukti secara sengaja memberikan data palsu secara berulang akan diblokir secara permanen dari sistem Monitoring MBG Nasional dan dilaporkan ke otoritas sekolah terkait.
             </p>
          </div>

          <button 
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-primary-sky text-white font-bold rounded-2xl shadow-lg shadow-primary-sky/20 active:scale-95 transition-all text-xs"
          >
            SAYA MENGERTI & SETUJU
          </button>
        </main>
      </div>
    </div>
  );
}
