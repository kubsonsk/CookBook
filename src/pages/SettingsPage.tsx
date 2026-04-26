import React, { useRef, useState } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { Moon, Sun, LogOut, ChevronRight, User, Info, Tag, Palette, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ACCENT_COLORS, AccentColor } from '../lib/colors';
import { cn } from '../lib/utils';
import { collection, writeBatch, doc, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Recipe } from '../types';

export default function SettingsPage() {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const user = auth.currentUser;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleWipeRecipes = async () => {
    if (!user) return;
    setIsWiping(true);
    try {
      const q = query(collection(db, 'recipes'), where('ownerId', '==', user.uid));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      
      await batch.commit();
      setShowWipeModal(false);
      alert(`Successfully wiped ${snap.docs.length} recipes.`);
    } catch (err) {
      console.error('Wipe error:', err);
      alert('Failed to wipe recipes.');
    } finally {
      setIsWiping(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImportStatus('importing');
    setImportMessage('Reading file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const recipes = Array.isArray(json) ? json : [json];

        setImportMessage(`Importing ${recipes.length} recipes...`);

        // Get existing labels to avoid duplicates
        const labelsQuery = query(collection(db, 'labels'), where('ownerId', '==', user.uid));
        const labelsSnap = await getDocs(labelsQuery);
        const existingLabelNames = new Set(labelsSnap.docs.map(d => d.data().name.toLowerCase()));

        const batch = writeBatch(db);
        const newLabels = new Set<string>();

        recipes.forEach((r: any) => {
          if (!r.title) return;

          const recipeRef = doc(collection(db, 'recipes'));
          const recipeData: Recipe = {
            title: r.title,
            servings: r.servings || 2,
            prepTime: r.prepTime || 30,
            heroImageUrl: r.heroImageUrl || '',
            videoUrl: r.videoUrl || '',
            labels: Array.isArray(r.labels) ? r.labels : [],
            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
            steps: Array.isArray(r.steps) ? r.steps : [],
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(recipeRef, recipeData);

          // Collect new labels
          recipeData.labels.forEach(labelName => {
            if (!existingLabelNames.has(labelName.toLowerCase())) {
              newLabels.add(labelName);
            }
          });
        });

        // Add new labels to batch
        newLabels.forEach(labelName => {
          const labelRef = doc(collection(db, 'labels'));
          batch.set(labelRef, {
            name: labelName,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          });
          existingLabelNames.add(labelName.toLowerCase()); // Avoid adding same label multiple times in one import
        });

        await batch.commit();
        setImportStatus('success');
        setImportMessage(`Successfully imported ${recipes.length} recipes.`);
        
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (err) {
        console.error('Import error:', err);
        setImportStatus('error');
        setImportMessage('Failed to parse or import JSON. Check file format.');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 pb-12"
    >
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
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm divide-y divide-slate-50 dark:divide-zinc-800/50">
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

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload size={20} className="text-primary-500" />
                <span className="font-bold">Bulk Import</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
              <button
                disabled={importStatus === 'importing'}
                onClick={handleImportClick}
                className="px-4 py-2 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50"
              >
                Choose JSON
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                    <ChevronRight size={20} className="rotate-90 text-primary-500" />
                </div>
                <span className="font-bold">Bulk Export</span>
              </div>
              <button
                onClick={async () => {
                  if (!user) return;
                  try {
                    const q = query(collection(db, 'recipes'), where('ownerId', '==', user.uid));
                    const snap = await getDocs(q);
                    const recipes = snap.docs.map(d => {
                      const data = d.data();
                      // Remove internal fields for export
                      const { ownerId, createdAt, updatedAt, rating, ...exportData } = data;
                      return exportData;
                    });
                    
                    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cookbook-export-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Export error:', err);
                    alert('Failed to export recipes.');
                  }
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Download JSON
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {importStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "p-3 rounded-2xl flex items-center gap-3 text-sm font-medium",
                    importStatus === 'importing' && "bg-slate-50 dark:bg-zinc-800/50 text-slate-500",
                    importStatus === 'success' && "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400",
                    importStatus === 'error' && "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                  )}
                >
                  {importStatus === 'importing' && <Loader2 size={18} className="animate-spin" />}
                  {importStatus === 'success' && <CheckCircle2 size={18} />}
                  {importStatus === 'error' && <AlertCircle size={18} />}
                  {importMessage}
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed px-1">
              Import multiple recipes from a JSON file. Ensure the format matches the expected recipe structure.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 ml-4">Danger Zone</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-red-100 dark:border-red-950/20 overflow-hidden shadow-sm">
          <button 
            onClick={() => setShowWipeModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors group"
          >
            <div className="flex items-center gap-3 text-red-500">
              <Trash2 size={20} />
              <span className="font-bold">Wipe All Recipes</span>
            </div>
            <ChevronRight size={18} className="text-red-200 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </section>

      <div className="text-center pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-zinc-700">Made with 🧡 for local chefs</p>
      </div>

      <AnimatePresence>
        {showWipeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-red-600">Danger Zone</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Are you absolutely sure? This will permanently delete ALL your recipes. This action cannot be undone.
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  disabled={isWiping}
                  onClick={handleWipeRecipes}
                  className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  {isWiping ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Yes, Wipe Everything
                </button>
                <button
                  disabled={isWiping}
                  onClick={() => setShowWipeModal(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
