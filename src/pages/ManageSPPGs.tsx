import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SPPG, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  Building2, 
  MapPin, 
  X,
  Save,
  Star,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageSPPGs = () => {
  const [sppgs, setSppgs] = useState<SPPG[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSPPG, setEditingSPPG] = useState<SPPG | null>(null);
  const [formData, setFormData] = useState({ name: '', province: '', city: '' });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSPPGs();
  }, []);

  const fetchSPPGs = async () => {
    try {
      const q = query(collection(db, 'sppgs'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SPPG));
      // Sort manually to avoid index requirement for first run
      data.sort((a, b) => a.name.localeCompare(b.name));
      setSppgs(data);
    } catch (err) {
      setError('Gagal memuat data SPPG. Silakan refresh halaman.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sppg?: SPPG) => {
    setError(null);
    if (sppg) {
      setEditingSPPG(sppg);
      setFormData({ name: sppg.name, province: sppg.province, city: sppg.city });
    } else {
      setEditingSPPG(null);
      setFormData({ name: '', province: '', city: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingSPPG) {
        await updateDoc(doc(db, 'sppgs', editingSPPG.id), formData);
      } else {
        // Initial state for new SPPG
        await addDoc(collection(db, 'sppgs'), {
          ...formData,
          average_rating: 0,
          total_reports: 0
        });
      }
      await fetchSPPGs();
      setIsModalOpen(false);
    } catch (err) {
      setError(editingSPPG ? 'Gagal mengubah data SPPG.' : 'Gagal menambah SPPG baru. Pastikan Anda memiliki akses admin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus SPPG ini? Semua data terkait laporan SPPG ini akan kehilangan referensi.')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'sppgs', id));
      await fetchSPPGs();
    } catch (err) {
      setError('Gagal menghapus data SPPG.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSPPGs = sppgs.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-on-surface"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">Kelola SPPG</h1>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Penyelenggara Program Gizi</p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-warning-yellow text-surface-dark rounded-xl font-bold text-sm shadow-lg shadow-warning-yellow/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Tambah SPPG</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-danger-red/10 border border-danger-red/20 rounded-2xl flex items-center gap-3 text-danger-red text-sm font-medium">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input 
            type="text"
            placeholder="Cari nama SPPG, wilayah, atau penempatan..."
            className="w-full bg-white/5 border border-outline-variant/30 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:border-warning-yellow transition-colors font-medium placeholder:text-on-surface-variant/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* SPPGs List */}
        {loading && sppgs.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-warning-yellow/30 border-t-warning-yellow rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredSPPGs.map((sppg) => (
                <motion.div 
                  key={sppg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 border border-outline-variant/20 rounded-3xl p-6 hover:border-warning-yellow/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-warning-yellow/10 text-warning-yellow flex items-center justify-center">
                      <Building2 size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenModal(sppg)}
                        className="p-2 text-on-surface-variant hover:text-warning-yellow hover:bg-warning-yellow/10 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(sppg.id)}
                        className="p-2 text-on-surface-variant hover:text-danger-red hover:bg-danger-red/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-on-surface mb-2 line-clamp-1">{sppg.name}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                      <MapPin size={14} className="text-warning-yellow" />
                      <span>{sppg.city}, {sppg.province}</span>
                    </div>
                    
                    <div className="flex gap-4 pt-2 border-t border-outline-variant/10">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-warning-yellow fill-warning-yellow" />
                        <span className="text-xs font-bold text-on-surface">{sppg.average_rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-on-surface-variant" />
                        <span className="text-xs font-bold text-on-surface">{sppg.total_reports} Laporan</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredSPPGs.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-on-surface-variant" />
                </div>
                <p className="text-on-surface-variant font-medium">Tidak ada SPPG yang ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface border border-outline-variant/30 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-on-surface tracking-tight">
                    {editingSPPG ? 'Edit SPPG' : 'Tambah SPPG Baru'}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Detail Provider Konsumsi</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} className="text-on-surface" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Nama SPPG / Vendor</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-white/5 border border-outline-variant/30 rounded-2xl py-4 px-5 text-on-surface focus:outline-none focus:border-warning-yellow transition-colors font-medium"
                    placeholder="Contoh: Catering Berkah Jaya"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Provinsi</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-white/5 border border-outline-variant/30 rounded-2xl py-4 px-5 text-on-surface focus:outline-none focus:border-warning-yellow transition-colors font-medium"
                      placeholder="Contoh: Jawa Tengah"
                      value={formData.province}
                      onChange={(e) => setFormData({...formData, province: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Kota/Kabupaten</label>
                    <input 
                      required
                      type="text"
                      className="w-full bg-white/5 border border-outline-variant/30 rounded-2xl py-4 px-5 text-on-surface focus:outline-none focus:border-warning-yellow transition-colors font-medium"
                      placeholder="Contoh: Semarang"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-on-surface font-black rounded-2xl bg-white/5 border border-outline-variant/30 active:scale-95 transition-all text-sm"
                  >
                    BATAL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-warning-yellow text-surface-dark font-black rounded-2xl shadow-lg shadow-warning-yellow/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    <span>{editingSPPG ? 'SIMPAN PERUBAHAN' : 'TAMBAH DATA'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageSPPGs;
