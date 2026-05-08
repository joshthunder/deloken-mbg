import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit, deleteDoc, doc, updateDoc, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Report, SPPG, School, User, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { 
  Users, 
  FileText, 
  School as SchoolIcon, 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal, 
  Eye, 
  Trash2,
  CheckCircle2,
  CheckSquare,
  Clock,
  Star,
  Bell,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import IndonesiaHeatmap from '../components/IndonesiaHeatmap';

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewReportNotif, setShowNewReportNotif] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalSchools: 0,
    totalSPPGs: 0,
  });

  useEffect(() => {
    // 1. Real-time Reports Listener
    const reportsQuery = query(collection(db, 'reports'), orderBy('created_at', 'desc'), limit(50));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const newReports = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Report));
      
      // Notify if new report added (not on initial load)
      if (reports.length > 0 && newReports.length > reports.length) {
        setShowNewReportNotif(true);
        setTimeout(() => setShowNewReportNotif(false), 5000);
      }
      
      setReports(newReports);
      setStats(prev => ({ ...prev, totalReports: snapshot.size }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    // 2. Fetch Static Stats & SPPGs Once
    const fetchStaticData = async () => {
      try {
        const [userCount, schoolCount, sppgCount, sppgSnap] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'schools')),
          getCountFromServer(collection(db, 'sppgs')),
          getDocs(collection(db, 'sppgs')), // Still need docs for rankings
        ]);

        const sppgData = sppgSnap.docs.map(d => ({ id: d.id, ...d.data() } as SPPG)).sort((a, b) => b.average_rating - a.average_rating);
        setSppgs(sppgData);
        
        setStats({
          totalReports: stats.totalReports, // Keep the one from snapshot
          totalUsers: userCount.data().count,
          totalSchools: schoolCount.data().count,
          totalSPPGs: sppgCount.data().count,
        });
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        // Don't throw, just use fallback values
      }
    };

    fetchStaticData();

    return () => unsubscribeReports();
  }, []);

  const filteredReports = reports.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleUpdateStatus = async (reportId: string, newStatus: any) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: newStatus });
      setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleUpdateNote = async (reportId: string, note: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { admin_note: note });
      setReports(reports.map(r => r.id === reportId ? { ...r, admin_note: note } : r));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setDeleteConfirmationId(reportId);
  };

  const confirmDeleteReport = async () => {
    if (!deleteConfirmationId) return;
    try {
      await deleteDoc(doc(db, 'reports', deleteConfirmationId));
      setReports(reports.filter(r => r.id !== deleteConfirmationId));
      setDeleteConfirmationId(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `reports/${deleteConfirmationId}`);
    }
  };

  const chartData = sppgs.slice(0, 5).map(s => ({
     name: s.name.split(' ').slice(0, 2).join(' '),
     rating: s.average_rating
  }));

  const metricCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Laporan', value: stats.totalReports, icon: FileText, color: 'bg-violet-500' },
    { label: 'Total Sekolah', value: stats.totalSchools, icon: SchoolIcon, color: 'bg-emerald-500' },
    { label: 'Total SPPG', value: stats.totalSPPGs, icon: Truck, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 pb-20">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirmationId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="w-16 h-16 rounded-3xl bg-danger-red/10 text-danger-red flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-on-surface text-center tracking-tight mb-2">Are you sure you want to delete this report?</h3>
              <p className="text-xs text-on-surface-variant font-medium text-center leading-relaxed mb-8 uppercase tracking-widest">
                Konfirmasi ganda diperlukan untuk menghapus data.
              </p>
              
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl group">
                  <button 
                    onClick={confirmDeleteReport}
                    className="w-full py-4 bg-danger-red text-white font-black active:scale-95 transition-all text-xs z-10 relative"
                  >
                    KLIK UNTUK KONFIRMASI AKHIR
                  </button>
                </div>
                <button 
                  onClick={() => setDeleteConfirmationId(null)}
                  className="w-full py-4 bg-surface text-on-surface font-black rounded-2xl border border-outline-variant/30 active:scale-95 transition-all text-xs"
                >
                  BATALKAN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Notification Popover */}
      <AnimatePresence>
        {showNewReportNotif && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
          >
            <div className="bg-primary-sky text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Laporan Baru</p>
                <p className="text-[10px] font-bold opacity-90">Ada laporan masuk baru yang perlu ditinjau.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-on-surface tracking-tight">Admin Console</h2>
        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">National Oversight MBG</p>
      </div>

      {/* Metrics Grid Mobile */}
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-2 shadow-sm"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", card.color)}>
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{card.label}</p>
              <p className="text-2xl font-black text-on-surface tracking-tight">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          to="/admin/schools"
          className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-primary-blue transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center">
              <SchoolIcon size={24} />
            </div>
            <div>
              <h4 className="font-black text-on-surface tracking-tight">Kelola Sekolah</h4>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Update Master Data Sekolah</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-on-surface-variant group-hover:text-primary-blue group-hover:translate-x-1 transition-all" />
        </Link>
        <Link 
          to="/admin/sppgs"
          className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center justify-between group hover:border-warning-yellow transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-warning-yellow/10 text-warning-yellow flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="font-black text-on-surface tracking-tight">Kelola SPPG</h4>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Data Provider Konsumsi</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-on-surface-variant group-hover:text-warning-yellow group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Heatmap Section Mobile */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface">Peta Performa</h3>
           <span className="text-[10px] bg-primary-sky/10 text-primary-sky px-2 py-0.5 rounded-full font-bold">NASIONAL</span>
        </div>
        <div className="h-48 relative rounded-xl overflow-hidden border border-outline-variant/20 shadow-inner">
          <IndonesiaHeatmap />
        </div>
      </div>

      {/* Charts / Ranking Mobile Tabs could be here, but let's stack them */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4">Top 5 Performa SPPG</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" hide />
              <YAxis domain={[0, 5]} hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }}
              />
              <Bar dataKey="rating" radius={[4, 4, 0, 0]} barSize={25}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#0EA5E9' : '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Management Cards Mobile */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-black text-on-surface tracking-tight">Manajemen Laporan</h3>
          <div className="flex gap-2">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-[10px] font-bold bg-white border border-outline-variant/30 rounded-lg px-2 py-1 outline-none"
            >
              <option value="all">SEMUA</option>
              <option value="pending">PENDING</option>
              <option value="reviewed">REVIEWED</option>
              <option value="completed">OK</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredReports.length > 0 ? filteredReports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-3xl border border-outline-variant/40 flex flex-col gap-4 shadow-md relative overflow-hidden">
               {report.status === 'pending' && (
                 <div className="absolute top-0 left-0 w-1 h-full bg-warning-yellow"></div>
               )}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs",
                    report.status === 'pending' ? "bg-warning-yellow/10 text-warning-yellow" : "bg-surface text-on-surface-variant"
                  )}>
                     #{report.id.slice(0, 3).toUpperCase()}
                  </div>
                    <div>
                      <h4 className="text-sm font-black text-on-surface">{report.school_name}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-on-surface-variant font-bold">{report.sppg_name} • {report.report_date}</p>
                        {report.user_id === 'anonymous' && (
                          <span className="text-[8px] bg-outline-variant/30 text-on-surface-variant px-1.5 py-0.5 rounded-full font-black uppercase">Guest</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mt-1.5">
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", report.food_delivered ? "text-primary-sky bg-primary-sky/10" : "text-danger-red bg-danger-red/10")}>
                        {report.food_delivered ? 'TERKIRIM' : 'GAGAL'}
                      </span>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", report.on_time ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10")}>
                        {report.on_time ? 'ON TIME' : 'LATE'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm",
                  report.rating >= 4 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                )}>
                  {report.rating} <Star size={10} fill="currentColor" />
                </div>
              </div>

              {report.complaint && (
                <div className="bg-surface rounded-2xl p-4 border border-outline-variant/10 shadow-inner">
                   <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-tighter mb-2 flex items-center gap-1">
                     <FileText size={10} /> Feedback User:
                   </p>
                   <p className="text-[12px] text-on-surface font-medium leading-relaxed italic">
                     "{report.complaint}"
                   </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase ml-1 flex items-center gap-1">
                  <CheckSquare size={10} /> Kurasi & Verifikasi Admin
                </label>
                <textarea 
                  rows={2}
                  value={report.admin_note || ''}
                  onChange={(e) => handleUpdateNote(report.id, e.target.value)}
                  placeholder="Berikan umpan balik atau instruksi tindak lanjut..."
                  className="w-full px-4 py-3 rounded-2xl bg-surface border border-outline-variant/20 text-xs font-medium focus:ring-2 focus:ring-primary-sky/20 outline-none resize-none shadow-sm transition-all"
                />
              </div>

              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 flex bg-surface p-1 rounded-2xl border border-outline-variant/30">
                  <button 
                    onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black transition-all",
                      report.status === 'reviewed' ? "bg-primary-sky text-white shadow-md" : "text-on-surface-variant"
                    )}
                  >
                    TINJAU
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(report.id, 'completed')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black transition-all",
                      report.status === 'completed' ? "bg-success-green text-white shadow-md" : "text-on-surface-variant"
                    )}
                  >
                    APPROVE
                  </button>
                </div>
                <button 
                  onClick={() => handleDeleteReport(report.id)}
                  className="w-12 h-12 rounded-2xl bg-danger-red/10 text-danger-red flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="bg-white py-12 rounded-[2.5rem] border-2 border-dashed border-outline-variant/30 text-center">
              <p className="text-xs font-bold text-on-surface-variant">Tidak ada laporan yang sesuai kriteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Mobile Small Cards */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-black text-on-surface tracking-tight">Peringkat SPPG</h3>
        <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          {sppgs.slice(0, 3).map((sppg, i) => (
            <div key={sppg.id} className="p-4 flex items-center gap-4 border-b border-outline-variant/10">
               <div className="text-xl font-black text-outline/30 w-6 italic">#{i+1}</div>
               <div className="flex-1 min-w-0">
                 <p className="font-bold text-sm truncate">{sppg.name}</p>
                 <p className="text-[10px] text-on-surface-variant font-medium uppercase">{sppg.city}</p>
               </div>
               <div className="text-right">
                  <p className="text-sm font-black text-success-green">{sppg.average_rating}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
