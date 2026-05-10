import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Search, Loader2, Save } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Label, Recipe } from '../types';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface RecipeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
}

export function RecipeLabelModal({ isOpen, onClose, recipe }: RecipeLabelModalProps) {
  const { t } = useLanguage();
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [labelSearch, setLabelSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !isOpen) return;

    const q = query(
      collection(db, 'labels'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Label));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAvailableLabels(data);
      setFetching(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (recipe) {
      setSelectedLabels(recipe.labels || []);
    }
  }, [recipe, isOpen]);

  const toggleLabel = (labelName: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelName) 
        ? prev.filter(l => l !== labelName) 
        : [...prev, labelName]
    );
  };

  const handleSave = async () => {
    if (!recipe?.id || !auth.currentUser) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'recipes', recipe.id);
      await updateDoc(docRef, {
        labels: selectedLabels,
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error('Error updating labels:', err);
      alert(t('failed_save_recipe'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">{t('manage_labels_recipe')}</h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <X size={24} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={t('find_label_placeholder')}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
                value={labelSearch}
                onChange={(e) => setLabelSearch(e.target.value)}
              />
            </div>

            <div className="max-height-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {fetching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary-500" size={32} />
                </div>
              ) : availableLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableLabels
                    .filter(l => l.name.toLowerCase().includes(labelSearch.toLowerCase()))
                    .map(label => (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.name)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
                          selectedLabels.includes(label.name)
                            ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20"
                            : "bg-slate-50 dark:bg-zinc-800 border-slate-100 dark:border-zinc-800 text-slate-500 hover:border-primary-500/30"
                        )}
                      >
                        <Tag size={12} />
                        {label.name}
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-slate-400 dark:text-zinc-500">
                  {t('no_labels')}
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              {t('save_labels')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
