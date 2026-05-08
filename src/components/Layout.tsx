import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, Bell, User as UserIcon, ShieldAlert, MonitorCheck } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  user: User | null;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.role === 'admin' || user?.email === 'hokkyjoshua@gmail.com';

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Lapor', icon: FileText, path: '/submit-report' },
    { label: 'Admin', icon: ShieldAlert, path: '/admin', adminOnly: true },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin' || user?.email === 'hokkyjoshua@gmail.com';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      {/* Mobile Frame on Desktop */}
      <div className="w-full max-w-[480px] min-h-screen bg-white shadow-2xl flex flex-col relative overflow-hidden border-x border-outline-variant/30">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-outline-variant flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-primary-sky flex items-center justify-center text-white">
                <MonitorCheck size={20} />
             </div>
             <h1 className="font-bold text-lg text-primary-sky tracking-tight">Deloken MBG</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => isAdmin && navigate('/admin')}
              className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full group transition-colors relative"
            >
              <Bell size={20} />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-danger-red text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
              {user ? (
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 overflow-y-auto bg-surface/30">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-[480px] bg-white/80 backdrop-blur-md border-t border-outline-variant flex justify-around items-center px-4 py-3 z-50">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                location.pathname === item.path 
                  ? "text-primary-sky scale-110" 
                  : "text-on-surface-variant"
              )}
            >
              <item.icon size={location.pathname === item.path ? 24 : 20} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              <span className={cn("text-[10px] font-bold", location.pathname === item.path ? "opacity-100" : "opacity-70")}>
                {item.label}
              </span>
            </Link>
          ))}
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 text-danger-red opacity-70 hover:opacity-100 transition-opacity"
            >
              <LogOut size={20} />
              <span className="text-[10px] font-bold">Keluar</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="flex flex-col items-center gap-1 text-primary-sky opacity-70 hover:opacity-100 transition-opacity"
            >
              <LogOut size={20} className="rotate-180" />
              <span className="text-[10px] font-bold">Masuk</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
