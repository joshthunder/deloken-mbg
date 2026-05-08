import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '../lib/firebase';
import { User, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { MapPin, Truck, CheckSquare, Star, Camera, Send, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { PROVINCES, INDONESIA_LOCATIONS } from '../constants/locations';

interface SubmitReportProps {
  user?: User | null;
}

export default function SubmitReport({ user }: SubmitReportProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [availableSchools, setAvailableSchools] = useState<string[]>([]);
  const [availableSppgs, setAvailableSppgs] = useState<string[]>([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    school_name: user?.school_name || '',
    sppg_name: '',
    sppg_id: '',
    province: '', 
    city: '',
    report_date: new Date().toISOString().split('T')[0],
    food_delivered: true,
    on_time: true,
    portion_enough: true,
    rating: 0,
    complaint: '',
    photo_url: '',
  });

  const provinceOptions = formData.province ? INDONESIA_LOCATIONS[formData.province] || [] : [];

  // Fetch existing schools/sppgs in this city to provide as options (avoid typos)
  React.useEffect(() => {
    if (formData.city) {
      const fetchOptions = async () => {
        try {
          const schoolsQ = query(collection(db, 'schools'), where('city', '==', formData.city));
          const sppgsQ = query(collection(db, 'sppgs'), where('city', '==', formData.city));
          
          const [sSnap, pSnap] = await Promise.all([getDocs(schoolsQ), getDocs(sppgsQ)]);
          
          setAvailableSchools(sSnap.docs.map(d => d.data().name));
          setAvailableSppgs(pSnap.docs.map(d => d.data().name));
        } catch (e) {
          console.error("Error fetching location options:", e);
        }
      };
      fetchOptions();
    } else {
      setAvailableSchools([]);
      setAvailableSppgs([]);
    }
  }, [formData.city]);

  const [uploadURLPromise, setUploadURLPromise] = useState<Promise<string> | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show instant preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 2. Start compression and background upload immediately
      const uploadTask = (async () => {
        try {
          const options = {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          setPhotoFile(compressedFile);
          
          // Start actual Firebase Storage upload NOW
          const timestamp = Date.now();
          const fileName = `temp/${user?.id || 'anonymous'}_${timestamp}_${file.name}`;
          const storageRef = ref(storage, fileName);
          const snapshot = await uploadBytes(storageRef, compressedFile);
          return await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error("Background upload failed:", error);
          return '';
        }
      })();
      
      setUploadURLPromise(uploadTask);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadURLPromise(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      alert('Silakan berikan rating kualitas.');
      return;
    }
    
    setSubmitting(true);
    try {
      // 1. Generate IDs
      const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
      const schoolUid = `school_${sanitize(formData.province)}_${sanitize(formData.city)}_${sanitize(formData.school_name)}`;
      const sppgUid = `sppg_${sanitize(formData.province)}_${sanitize(formData.city)}_${sanitize(formData.sppg_name)}`;
      
      const reportsRef = collection(db, 'reports');
      const reportDocRef = doc(reportsRef);

      // 2. Wait for the background upload that started earlier
      const finalPhotoUrl = uploadURLPromise ? await uploadURLPromise : '';
      
      // 3. Submit final report (this will be very fast now)
      await setDoc(reportDocRef, {
        ...formData,
        photo_url: finalPhotoUrl || formData.photo_url,
        user_id: user?.id || 'anonymous',
        school_id: schoolUid,
        sppg_id: sppgUid,
        status: 'pending',
        id: reportDocRef.id,
        created_at: new Date().toISOString(),
      });
      
      // 4. Record metadata in background
      if (user) {
        setDoc(doc(db, 'schools', schoolUid), {
          name: formData.school_name,
          province: formData.province,
          city: formData.city,
          updated_at: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        setDoc(doc(db, 'sppgs', sppgUid), {
          name: formData.sppg_name,
          province: formData.province,
          city: formData.city,
          updated_at: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }

      setSubmitted(true);
      if (user) {
        setTimeout(() => navigate('/dashboard'), 800);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      <AnimatePresence>
        {submitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-success-green/10 text-success-green flex items-center justify-center"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-on-surface tracking-tight">Berhasil Terkirim!</h2>
                <p className="text-sm text-on-surface-variant font-medium">Laporan Anda telah masuk ke sistem dan sedang dikurasi oleh tim MBG.</p>
              </div>

              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "linear" }}
                  className="h-full bg-primary-sky"
                />
              </div>

              {user ? (
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Kembali ke Dashboard...</p>
              ) : (
                <div className="w-full space-y-3">
                  <p className="text-xs text-on-surface-variant font-medium">Sambil menunggu verifikasi, buat akun untuk memantau status laporan Anda ke depannya.</p>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => navigate('/register')}
                        className="py-3 bg-primary-sky text-white rounded-xl text-[10px] font-bold shadow-lg shadow-primary-sky/20"
                     >
                       BUAT AKUN
                     </button>
                     <button 
                        onClick={() => navigate('/')}
                        className="py-3 bg-surface border border-outline-variant rounded-xl text-[10px] font-bold"
                     >
                       KEMBALI KE AWAL
                     </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-on-surface tracking-tight tracking-[-0.02em]">Formulir Laporan MBG</h2>
        <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Kawal Kualitas Makan Siang</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-on-surface">
        {/* Section: Location */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-surface/50 flex items-center gap-3 border-b border-outline-variant/20">
            <MapPin className="text-primary-sky" size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Lokasi & Waktu</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Nama Sekolah *</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  list="school-list"
                  value={formData.school_name}
                  onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                  placeholder="Masukkan atau pilih nama sekolah"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
                />
                <datalist id="school-list">
                  {availableSchools.map((s, i) => <option key={i} value={s} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Provinsi *</label>
                <select 
                  required
                  value={formData.province}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setFormData({
                      ...formData, 
                      province: prov,
                      city: '' // Reset city when province changes
                    });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none appearance-none"
                >
                  <option value="">Pilih Provinsi</option>
                  {PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Kota/Kabupaten *</label>
                <select 
                  required
                  disabled={!formData.province}
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none appearance-none disabled:opacity-50"
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {provinceOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Penyedia Layanan (SPPG) *</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    list="sppg-list"
                    value={formData.sppg_name}
                    onChange={(e) => setFormData({...formData, sppg_name: e.target.value})}
                    placeholder="Masukkan atau pilih nama SPPG"
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
                  />
                  <datalist id="sppg-list">
                    {availableSppgs.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">ID SPPG (Opsional)</label>
                <input 
                  type="text"
                  value={formData.sppg_id}
                  onChange={(e) => setFormData({...formData, sppg_id: e.target.value})}
                  placeholder="ID Satuan Pelayanan"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Tanggal Pengiriman *</label>
              <input 
                type="date"
                required
                value={formData.report_date}
                onChange={(e) => setFormData({...formData, report_date: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section: Delivery Status */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
           <div className="px-5 py-3 bg-surface/50 flex items-center gap-3 border-b border-outline-variant/20">
            <Truck className="text-primary-sky" size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Status Pengiriman</h3>
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-on-surface leading-none">Makanan Sampai?</p>
                <p className="text-[10px] text-on-surface-variant leading-none">Konfirmasi kedatangan</p>
              </div>
              <div className="flex bg-surface p-1 rounded-xl border border-outline-variant gap-1 h-[40px] w-32 border-none">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, food_delivered: true})}
                  className={cn("flex-1 rounded-lg font-bold text-[10px] transition-all", formData.food_delivered ? "bg-primary-sky text-white shadow-sm" : "opacity-50")}
                >YA</button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, food_delivered: false})}
                  className={cn("flex-1 rounded-lg font-bold text-[10px] transition-all", !formData.food_delivered ? "bg-primary-sky text-white shadow-sm" : "opacity-50")}
                >TIDAK</button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-on-surface leading-none">Tepat Waktu?</p>
                <p className="text-[10px] text-on-surface-variant leading-none">Ketepatan jadwal</p>
              </div>
               <div className="flex bg-surface p-1 rounded-xl border border-outline-variant gap-1 h-[40px] w-32 border-none">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, on_time: true})}
                  className={cn("flex-1 rounded-lg font-bold text-[10px] transition-all", formData.on_time ? "bg-primary-sky text-white shadow-sm" : "opacity-50")}
                >YA</button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, on_time: false})}
                  className={cn("flex-1 rounded-lg font-bold text-[10px] transition-all", !formData.on_time ? "bg-primary-sky text-white shadow-sm" : "opacity-50")}
                >TIDAK</button>
              </div>
            </div>

             <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-on-surface leading-none">Porsi Cukup?</p>
                <p className="text-[10px] text-on-surface-variant leading-none">Kecukupan kuantitas</p>
              </div>
              <div className="flex bg-surface p-1 rounded-xl border border-outline-variant gap-1 h-[40px] w-32 border-none">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, portion_enough: true})}
                  className={cn("flex-1 rounded-lg font-bold text-[10px] transition-all", formData.portion_enough ? "bg-primary-sky text-white shadow-sm" : "opacity-50")}
                >YA</button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, portion_enough: false})}
                  className={cn("flex-1 rounded-lg font-bold text-[10px] transition-all", !formData.portion_enough ? "bg-danger-red text-white shadow-sm" : "opacity-50")}
                >KURANG</button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Quality & Evidence */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-surface/50 flex items-center gap-3 border-b border-outline-variant/20">
            <CheckSquare className="text-primary-sky" size={16} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Kualitas & Bukti</h3>
          </div>
          <div className="p-5 space-y-6">
            <div className="space-y-3">
               <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1 block">Rating Kelezatan *</label>
               <div className="flex justify-between px-2">
                 {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", formData.rating >= star ? "text-warning-yellow bg-warning-yellow/10 scale-110" : "text-outline bg-surface")}
                    >
                      <Star size={20} fill={formData.rating >= star ? "currentColor" : "none"} />
                    </button>
                 ))}
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1 block">Foto Makanan Terkini</label>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => handleFileChange(e)} 
              />
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={cameraInputRef} 
                onChange={(e) => handleFileChange(e)} 
              />

              {photoPreview ? (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-outline-variant shadow-inner bg-surface">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-2 bg-surface hover:bg-surface-variant transition-colors group active:scale-95"
                  >
                    <Camera size={24} className="text-outline group-hover:text-primary-sky" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Kamera</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-2 bg-surface hover:bg-surface-variant transition-colors group active:scale-95"
                  >
                    <ImageIcon size={24} className="text-outline group-hover:text-primary-sky" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Galeri</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Kesan & Pesan</label>
              <textarea 
                rows={3}
                value={formData.complaint}
                onChange={(e) => setFormData({...formData, complaint: e.target.value})}
                placeholder="Berikan detail tambahan jika ada..."
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button 
            type="button"
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="py-4 rounded-2xl font-bold text-xs text-on-surface-variant bg-surface border border-outline-variant/30 active:scale-95 transition-all"
          >BATAL</button>
          <button 
            type="submit"
            disabled={submitting}
            className="py-4 bg-primary-sky text-white font-bold rounded-2xl shadow-lg shadow-primary-sky/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
          >
            {submitting ? 'MENGIRIM...' : (
              <>
                KIRIM LAPORAN
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
