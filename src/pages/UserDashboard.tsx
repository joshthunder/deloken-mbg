import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Report, OperationType, SPPG } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Map as MapIcon,
  Globe,
  Newspaper,
  Sparkles,
  Info,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleGenAI } from "@google/genai";

interface UserDashboardProps {
  user: User;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch User Reports
        const reportsQ = query(
          collection(db, 'reports'),
          where('user_id', '==', user.id),
          orderBy('created_at', 'desc'),
          limit(5)
        );
        
        // Use Count for stats instead of fetching all docs (FASTER)
        const totalCountQ = query(collection(db, 'reports'), where('user_id', '==', user.id));
        const pendingCountQ = query(collection(db, 'reports'), where('user_id', '==', user.id), where('status', '==', 'pending'));
        const completedCountQ = query(collection(db, 'reports'), where('user_id', '==', user.id), where('status', '==', 'completed'));
        
        // 2. Fetch SPPGs for Leaderboard
        const sppgsQ = query(collection(db, 'sppgs'), orderBy('average_rating', 'desc'), limit(10));

        const [recentSnapshot, totalSnap, pendingSnap, completedSnap, sppgSnap] = await Promise.all([
          getDocs(reportsQ),
          getCountFromServer(totalCountQ),
          getCountFromServer(pendingCountQ),
          getCountFromServer(completedCountQ),
          getDocs(sppgsQ)
        ]);

        const reportsData = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        setReports(reportsData);

        setStats({
          total: totalSnap.data().count,
          pending: pendingSnap.data().count,
          completed: completedSnap.data().count
        });

        const sppgsData = sppgSnap.docs.map(d => ({ id: d.id, ...d.data() } as SPPG));
        setSppgs(sppgsData);

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dashboard_data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchNews();
  }, [user.id]);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate 3 short, realistic news headlines and 1-sentence summaries about SPPG (Satuan Pelayanan Program Gizi) and BGN (Badan Gizi Nasional) activities in Indonesia. Format as JSON array of objects with keys: id, title, source, time, summary, sentiment (positive/neutral/negative). Use Indonesian language for content.",
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const newsData = JSON.parse(response.text || '[]');
      setNews(newsData);
    } catch (error) {
      console.error("News Generation Error:", error);
      // Fallback news
      setNews([
        { id: '1', title: 'BGN Siapkan Unit Pelayanan Baru di Jawa Timur', source: 'Admin BGN', time: '10 min ago', summary: 'Persiapan percepatan program MBG di wilayah timur Jawa.', sentiment: 'positive' },
        { id: '2', title: 'Standarisasi Menu SPPG Tahap II Selesai', source: 'Info Gizi', time: '1 hour ago', summary: 'Pedoman gizi baru telah didistribusikan ke seluruh unit pelayanan.', sentiment: 'neutral' }
      ]);
    } finally {
      setNewsLoading(false);
    }
  };

  const topSppgs = [...sppgs].sort((a, b) => b.average_rating - a.average_rating).slice(0, 3);
  const bottomSppgs = [...sppgs].sort((a, b) => a.average_rating - b.average_rating).slice(0, 3);

  const cards = [
    { label: 'Total Laporan', value: stats.total, icon: FileText, color: 'bg-primary-sky' },
    { label: 'Proses', value: stats.pending, icon: Clock, color: 'bg-warning-yellow' },
    { label: 'Selesai', value: stats.completed, icon: CheckCircle2, color: 'bg-success-green' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">Halo, {user.full_name.split(' ')[0]}!</h2>
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Pantau Kontribusi MBG Anda</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={fetchNews}
            className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-primary-sky/10 hover:text-primary-sky transition-all"
          >
            <Sparkles size={16} />
          </motion.button>
        </div>
      </div>

      {/* Primary Action */}
      <Link 
        to="/submit-report" 
        className="w-full bg-primary-sky text-white p-5 rounded-2xl font-bold flex items-center justify-between shadow-lg shadow-primary-sky/20 active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus size={24} />
          </div>
          <span className="text-base font-black">Buat Laporan Baru</span>
        </div>
        <ChevronRight size={20} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Stats - Horizontal Scrollable or Grid */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-3 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 items-center text-center"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", card.color)}>
              <card.icon size={16} />
            </div>
            <div>
              <p className="text-xl font-black text-on-surface leading-none">{card.value}</p>
              <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-tighter mt-1">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* News Feed - Real Time Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-primary-sky" />
            <h3 className="text-base font-black text-on-surface tracking-tight">Kabar MBG Terkini</h3>
          </div>
          <span className="px-2 py-0.5 bg-success-green/10 text-success-green text-[8px] font-black rounded-full uppercase">Real-Time</span>
        </div>

        <div className="space-y-3">
          {newsLoading ? (
            <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 animate-pulse space-y-3">
               <div className="h-4 bg-surface-variant rounded w-3/4"></div>
               <div className="h-3 bg-surface-variant rounded w-1/2"></div>
            </div>
          ) : (
            news.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-4 rounded-2xl border border-outline-variant/30 relative overflow-hidden"
              >
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  item.sentiment === 'positive' ? 'bg-success-green' : item.sentiment === 'negative' ? 'bg-danger-red' : 'bg-primary-sky'
                )} />
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-primary-sky uppercase tracking-widest">{item.source}</span>
                  <span className="text-[9px] text-on-surface-variant font-medium">{item.time}</span>
                </div>
                <h4 className="text-sm font-bold text-on-surface leading-tight mb-1">{item.title}</h4>
                <p className="text-[10px] text-on-surface-variant line-clamp-2">{item.summary}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Map Insight */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-primary-sky" />
            <h3 className="text-base font-black text-on-surface tracking-tight">Peta Laporan</h3>
          </div>
        </div>
        <div className="h-48 rounded-2xl overflow-hidden border border-outline-variant/30 shadow-inner bg-surface-variant/10 relative">
          <MapContainer 
            center={[-2.5489, 118.0149] as any} 
            zoom={4} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((report) => (
              <CircleMarker 
                key={report.id} 
                center={[-6.2088 + (Math.random() - 0.5) * 5, 106.8456 + (Math.random() - 0.5) * 20] as any} 
                radius={8}
                pathOptions={{
                  fillColor: report.status === 'completed' ? '#1AC86F' : '#F7B500',
                  fillOpacity: 0.6,
                  color: 'white',
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-[10px] font-bold">
                    <p>Unit #{report.id.slice(0,4).toUpperCase()}</p>
                    <p className="font-normal opacity-70">{report.report_date}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="absolute bottom-2 right-2 z-[1000] bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-outline-variant/30 space-y-1 scale-75 origin-bottom-right">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-green"></div>
                <span className="text-[10px] font-bold">Selesai</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning-yellow"></div>
                <span className="text-[10px] font-bold">Proses</span>
             </div>
          </div>
        </div>
      </div>

      {/* Leaderboard SPPG */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-success-green" />
            <h3 className="text-base font-black text-on-surface tracking-tight">Kinerja SPPG</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-outline-variant/30 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-success-green" />
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">3 Tertinggi (Terbaik)</span>
              </div>
              <div className="space-y-3">
                {topSppgs.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-success-green/10 text-success-green flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold text-on-surface truncate max-w-[120px]">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-warning-yellow fill-warning-yellow" />
                        <span className="text-xs font-black text-on-surface">{s.average_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={14} className="text-danger-red" />
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">3 Terendah (Evaluasi)</span>
              </div>
              <div className="space-y-3">
                {bottomSppgs.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-danger-red/10 text-danger-red flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold text-on-surface truncate max-w-[120px]">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-on-surface-variant" />
                        <span className="text-xs font-black text-on-surface">{s.average_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity (Original) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-on-surface tracking-tight">Aktivitas Terakhir Saya</h3>
          <button className="text-primary-sky font-bold text-[10px] uppercase tracking-wider">Lihat Semua</button>
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="h-20 bg-white rounded-2xl border border-outline-variant/30 animate-pulse"></div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <motion.div 
                key={report.id}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between hover:border-primary-sky/30 transition-colors"
              >
                <div className="flex gap-4 items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    report.status === 'pending' ? "bg-warning-yellow/10 text-warning-yellow" : 
                    report.status === 'reviewed' ? "bg-primary-sky/10 text-primary-sky" : 
                    "bg-success-green/10 text-success-green"
                  )}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{report.school_name}</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      {report.sppg_name} • {new Date(report.report_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  report.status === 'pending' ? "bg-warning-yellow/10 text-warning-yellow" : 
                  report.status === 'reviewed' ? "bg-primary-sky/10 text-primary-sky" : 
                  "bg-success-green/10 text-success-green"
                )}>
                  {report.status === 'pending' ? 'Beres' : report.status === 'reviewed' ? 'Tinjau' : 'Oke'}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white py-10 rounded-2xl border border-dashed border-outline-variant text-center">
              <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">Belum ada laporan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
