import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // New users will be redirected to profile completion via Auth guard context
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.');
      } else if (err.code === 'auth/weak-password') {
        setError('Kata sandi terlalu lemah (minimal 6 karakter).');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Metode pendaftaran Email/Password belum diaktifkan di Firebase Console.');
      } else {
        setError('Gagal mendaftar. Silakan coba lagi nanti.');
      }
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Gagal mendaftar dengan Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl border border-outline-variant overflow-hidden"
      >
        <div className="p-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-secondary-blue/10 flex items-center justify-center text-secondary-blue mb-6">
             <UserPlus size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-on-surface tracking-tight mb-2">Buat Akun</h1>
          <p className="text-sm text-on-surface-variant font-medium text-center leading-relaxed mb-8">
            Gabung Komunitas Deloken MBG
          </p>

          {error && (
            <div className="w-full bg-danger-red/10 text-danger-red p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-danger-red/20 mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Email</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant bg-surface text-sm focus:border-secondary-blue outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Kata Sandi (Min. 6 Karakter)</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant bg-surface text-sm focus:border-secondary-blue outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-secondary-blue text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 text-xs mt-2"
            >
              DAFTAR SEKARANG
            </button>
          </form>

          <div className="w-full flex items-center gap-3 my-6">
            <div className="h-[1px] bg-outline-variant/30 flex-1"></div>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">Atau</span>
            <div className="h-[1px] bg-outline-variant/30 flex-1"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full bg-white text-on-surface font-black py-4 rounded-2xl border-2 border-outline-variant hover:border-secondary-blue active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-sm text-xs"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            DAFTAR DENGAN GOOGLE
          </button>

          <p className="mt-8 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest leading-loose text-center">
            Sudah punya akun resmi? <br />
            <button onClick={() => navigate('/login')} className="text-secondary-blue">Masuk Di Sini</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
