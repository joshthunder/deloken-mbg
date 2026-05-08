import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Metode masuk Email/Password belum diaktifkan di Firebase Console.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email atau kata sandi salah. Silakan coba lagi.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Email tidak terdaftar.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Kata sandi salah.');
      } else {
        setError('Gagal masuk. Silakan periksa koneksi Anda.');
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Gagal masuk dengan Google.');
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
          <div className="w-16 h-16 rounded-3xl bg-primary-sky/10 flex items-center justify-center text-primary-sky mb-6">
             <LogIn size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-on-surface tracking-tight mb-2">Deloken MBG</h1>
          <p className="text-sm text-on-surface-variant font-medium text-center leading-relaxed mb-8">
            Monitoring Gizi Nasional
          </p>

          {error && (
            <div className="w-full bg-danger-red/10 text-danger-red p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-danger-red/20 mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Email</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sekolah.sch.id"
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Kata Sandi</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant bg-surface text-sm focus:border-primary-sky outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary-sky text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 text-xs mt-2"
            >
              MASUK
            </button>
          </form>

          <div className="w-full flex items-center gap-3 my-6">
            <div className="h-[1px] bg-outline-variant/30 flex-1"></div>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">Atau</span>
            <div className="h-[1px] bg-outline-variant/30 flex-1"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-on-surface font-black py-4 rounded-2xl border-2 border-outline-variant hover:border-primary-sky active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-sm text-xs"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            MASUK DENGAN GOOGLE
          </button>

          <p className="mt-8 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest leading-loose text-center">
            Belum punya akun? <br />
            <button onClick={() => navigate('/register')} className="text-secondary-blue">Daftar Akun Baru</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
