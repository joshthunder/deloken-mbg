import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { School, User as UserIcon, Send, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { UserCategory } from '../types';

export default function CompleteProfile() {
  const [fullName, setFullName] = useState(auth.currentUser?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [school, setSchool] = useState('');
  const [category, setCategory] = useState<UserCategory>('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const isAdmin = auth.currentUser.email === 'hokkyjoshua@gmail.com';
      
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        full_name: fullName,
        email: auth.currentUser.email,
        phone_number: phoneNumber,
        school_name: school || null,
        category,
        role: isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString(),
      });
      
      // onSnapshot in App.tsx will pick up the change and navigate automatically
      // But we call navigate just in case to ensure we land on dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-outline-variant overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-sky/10 text-primary-sky flex items-center justify-center mx-auto mb-4">
              <UserIcon size={32} />
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">Lengkapi Profil</h1>
            <p className="text-xs text-on-surface-variant font-medium mt-1">Satu langkah lagi untuk mulai melapor.</p>
          </div>

          <form onSubmit={handleComplete} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Nama Lengkap</label>
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Nomor Telepon / WhatsApp</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Nama Sekolah (Opsional)</label>
              <div className="relative">
                <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Contoh: SDN 01 Menteng"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Kategori Anda</label>
              <select 
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as UserCategory)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none appearance-none"
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru / Staf Sekolah</option>
                <option value="parent">Orang Tua Murid</option>
                <option value="public">Umum</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary-sky text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs mt-4"
            >
              {loading ? 'MENYIMPAN...' : (
                <>
                  SELESAIKAN PROFIL
                  <Send size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
