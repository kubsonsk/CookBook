import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, PlusCircle, Settings, ChefHat, LogOut, WifiOff } from 'lucide-react';
import { cn } from './lib/utils';
import HomePage from './pages/HomePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeFormPage from './pages/RecipeFormPage';
import SettingsPage from './pages/SettingsPage';
import LabelManagementPage from './pages/LabelManagementPage';

import { auth } from './lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useOnlineStatus } from './lib/hooks';

const ThemeContext = createContext<{ theme: 'light' | 'dark', toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error", error);
      alert("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/20 text-white">
            <ChefHat size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">CookBook</h1>
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Your personal AI-powered digital recipe box.</p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa_site/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
              Sign in with Google
            </>
          )}
        </button>
        
        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Secure Cloud Storage Included</p>
      </motion.div>
    </div>
  );
}

function OfflineBanner() {
  const isOnline = useOnlineStatus();
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-zinc-900 text-white overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold uppercase tracking-widest">
            <WifiOff size={14} />
            Offline Mode Active
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Recipes', icon: HomeIcon },
    { path: '/add', label: 'Add', icon: PlusCircle },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-20 font-sans transition-colors duration-300">
      <OfflineBanner />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 pb-safe">
        <div className="flex justify-around items-center max-w-2xl mx-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) => 
                  cn(
                    "flex flex-col items-center gap-1 transition-colors relative px-4 py-1",
                    isActive ? "text-orange-500" : "text-slate-400 dark:text-zinc-500"
                  )
                }
              >
                <Icon size={24} />
                <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute -bottom-2 h-0.5 w-8 bg-orange-500 rounded-full"
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      metaThemeColors.forEach(meta => {
        meta.setAttribute('content', '#09090b');
      });
    } else {
      root.classList.remove('dark');
      metaThemeColors.forEach(meta => {
        meta.setAttribute('content', '#f97316');
      });
    }
  }, [theme]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('Toggling theme to:', newTheme);
    setTheme(newTheme);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <ChefHat className="animate-bounce text-orange-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <LoginPage />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipe/:id" element={<RecipeDetailPage />} />
            <Route path="/add" element={<RecipeFormPage />} />
            <Route path="/edit/:id" element={<RecipeFormPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/labels" element={<LabelManagementPage />} />

          </Routes>
        </Layout>
      </Router>
    </ThemeContext.Provider>
  );
}
