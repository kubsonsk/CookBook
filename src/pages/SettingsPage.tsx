import React from 'react';
import { useTheme } from '../lib/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Moon, Sun, LogOut, ChevronRight, User, Info, Tag, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ACCENT_COLORS, AccentColor } from '../lib/colors';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();

  const user = auth.currentUser;

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight">Settings</h2>
        <p className="text-slate-400 dark:text-zinc-500 text-sm">Personalize your cooking experience.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 ml-4">Account</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 p-4 border-b border-slate-50 dark:border-zinc-800/50">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500 flex-shrink-0 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center transition-colors duration-500">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer" />
              ) : (
                <User size={24} className="text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{user?.displayName || 'Chef'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors group"
          >
            <div className="flex items-center gap-3 text-red-500">
              <LogOut size={20} />
              <span className="font-bold">Sign Out</span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-red-300 transition-colors" />
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 ml-4">Appearance</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm divide-y divide-slate-50 dark:divide-zinc-800/50">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-slate-400" />}
              <span className="font-bold">{theme === 'light' ? 'Light Appearance' : 'Dark Appearance'}</span>
            </div>
            <div className={
              `w-12 h-6 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-primary-500' : 'bg-slate-200'}`
            }>
               <motion.div 
                 animate={{ x: theme === 'dark' ? 24 : 0 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
                 className="w-4 h-4 bg-white rounded-full shadow-sm"
               />
            </div>
          </button>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Palette size={20} className="text-primary-500 transition-colors duration-500" />
              <span className="font-bold">Accent Color</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-full border-4 transition-all active:scale-90",
                    accentColor === color 
                      ? "border-primary-500/20 scale-110" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: ACCENT_COLORS[color][500] }}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                >
                  {accentColor === color && (
                    <motion.div 
                      layoutId="activeColor"
                      className="w-full h-full rounded-full border-2 border-white dark:border-zinc-900"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 ml-4">Content</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
          <Link 
            to="/settings/labels"
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Tag size={20} className="text-primary-500" />
              <span className="font-bold">Manage Labels</span>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 ml-4">About</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 text-slate-600 dark:text-zinc-400">
              <Info size={20} />
              <span className="font-bold">Version</span>
            </div>
            <span className="text-xs font-mono text-slate-300">1.2.0</span>
          </div>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-zinc-700">Made with 🧡 for local chefs</p>
      </div>
    </div>
  );
}
