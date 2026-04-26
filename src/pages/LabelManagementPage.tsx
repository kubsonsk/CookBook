import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Label } from '../types';
import { ArrowLeft, Plus, Trash2, Tag, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function LabelManagementPage() {
  const navigate = useNavigate();
  const [labels, setLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'labels'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Label));
      // Sort in-memory by createdAt desc
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setLabels(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim() || !auth.currentUser) return;

    const name = newLabelName.trim();
    if (labels.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      alert('Label already exists');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'labels'), {
        name,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setNewLabelName('');
    } catch (err) {
      console.error(err);
      alert('Failed to add label');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLabel = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this label? It will be removed from all recipes.')) {
      try {
        await deleteDoc(doc(db, 'labels', id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete label');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 pb-20"
    >
      <div className="flex items-center justify-between -mt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-zinc-400">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tight">Manage Labels</h2>
        <div className="w-10" />
      </div>

      <form onSubmit={handleAddLabel} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New label name (e.g. Italian)"
            className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary-500/20 font-bold"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving || !newLabelName.trim()}
            className="px-6 bg-primary-500 text-white rounded-2xl font-bold disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 ml-4">Your Labels</h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : labels.length > 0 ? (
          <div className="grid gap-2">
            <AnimatePresence>
              {labels.map((label) => (
                <motion.div
                  key={label.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={18} className="text-primary-500" />
                    <span className="font-bold">{label.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLabel(label.id!)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
            <p className="text-slate-400 dark:text-zinc-500">No labels created yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
