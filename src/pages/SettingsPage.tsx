import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  User, 
  Shield, 
  Bell, 
  Moon, 
  ChevronRight, 
  LogOut, 
  HelpCircle,
  FileText,
  Mail
} from 'lucide-react';
import { motion } from 'motion/react';
import { User as AppUser } from '../types';
import { cn } from '../lib/utils';

interface SettingsPageProps {
  user: AppUser | null;
}

export default function SettingsPage({ user }: SettingsPageProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const settingGroups = [
    {
      title: "Akun & Keamanan",
      items: [
        { icon: Shield, label: "Privasi Data", path: "/guidelines", color: "text-primary-sky" },
        { icon: Mail, label: "Update Email Resmi", path: "#", color: "text-secondary-blue" },
      ]
    },
    {
      title: "Preferensi Aplikasi",
      items: [
        { icon: Bell, label: "Notifikasi Laporan", path: "#", color: "text-amber-500", toggle: true },
        { icon: Moon, label: "Mode Gelap", path: "#", color: "text-purple-500", toggle: true },
      ]
    },
    {
      title: "Informasi & Bantuan",
      items: [
        { icon: FileText, label: "Panduan Komunitas", path: "/guidelines", color: "text-success-green" },
        { icon: HelpCircle, label: "Pusat Bantuan", path: "#", color: "text-on-surface-variant" },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center text-center gap-4 pt-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-surface-container-high overflow-hidden border-4 border-white shadow-xl">
             <img 
               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
               alt="Avatar" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
             />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-sky text-white rounded-xl border-4 border-white flex items-center justify-center">
            <User size={14} />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black text-on-surface tracking-tight">{user?.full_name || "User Deloken"}</h2>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">
            {user?.category} • {user?.role}
          </p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-6">
        {settingGroups.map((group, i) => (
          <div key={i} className="space-y-3">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 ml-1">
              {group.title}
            </h3>
            <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
              {group.items.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between p-4 active:bg-surface transition-colors",
                    idx < group.items.length - 1 && "border-b border-outline-variant/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-surface", item.color)}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-on-surface">{item.label}</span>
                  </div>
                  {item.toggle ? (
                    <div className="w-10 h-6 bg-surface-variant rounded-full relative flex items-center px-1">
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-outline" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="pt-4">
        <button 
          onClick={handleLogout}
          className="w-full bg-danger-red/5 hover:bg-danger-red/10 text-danger-red border border-danger-red/10 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <LogOut size={16} />
          KELUAR DARI APLIKASI
        </button>
        <p className="text-center text-[10px] text-on-surface-variant font-medium mt-6">
          Versi Aplikasi v1.0.4-beta <br />
          Deloken MBG Platform Monitoring Nasional
        </p>
      </div>
    </div>
  );
}
