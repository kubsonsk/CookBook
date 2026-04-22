import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Recipe, DEFAULT_TAGS } from '../types';
import { ArrowLeft, Tag, Edit2, Trash2, Plus, Loader2, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TagsManagementPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTags = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'recipes'), where('ownerId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const uniqueTags = new Set<string>(DEFAULT_TAGS);
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Recipe;
        (data.tags || []).forEach(tag => uniqueTags.add(tag));
      });
      setTags(Array.from(uniqueTags).sort());
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleRename = async (oldTag: string) => {
    if (!newTagName.trim() || newTagName === oldTag) {
      setEditingTag(null);
      return;
    }

    setProcessing(true);
    try {
      const q = query(
        collection(db, 'recipes'), 
        where('ownerId', '==', auth.currentUser?.uid),
        where('tags', 'array-contains', oldTag)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((recipeDoc) => {
        const data = recipeDoc.data() as Recipe;
        const updatedTags = data.tags.map(t => t === oldTag ? newTagName.trim() : t);
        batch.update(doc(db, 'recipes', recipeDoc.id), { tags: updatedTags });
      });

      await batch.commit();
      setEditingTag(null);
      setNewTagName('');
      await fetchTags();
    } catch (error) {
      console.error("Error renaming tag:", error);
      alert("Failed to rename tag.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (tagToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete the tag "${tagToDelete}" from all recipes?`)) return;

    setProcessing(true);
    try {
      const q = query(
        collection(db, 'recipes'), 
        where('ownerId', '==', auth.currentUser?.uid),
        where('tags', 'array-contains', tagToDelete)
      );
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((recipeDoc) => {
        const data = recipeDoc.data() as Recipe;
        const updatedTags = data.tags.filter(t => t !== tagToDelete);
        batch.update(doc(db, 'recipes', recipeDoc.id), { tags: updatedTags });
      });

      await batch.commit();
      await fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAdd = () => {
    if (!newTagName.trim()) return;
    const tag = newTagName.trim();
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag].sort());
    }
    setNewTagName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 -mt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-zinc-400">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tight">Manage Tags</h2>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-zinc-800/50">
            {tags.map((tag) => (
              <div key={tag} className="p-4 flex items-center justify-between group">
                {editingTag === tag ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500/20"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(tag)}
                    />
                    <button 
                      onClick={() => handleRename(tag)}
                      disabled={processing}
                      className="p-1 text-green-500"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={() => { setEditingTag(null); setNewTagName(''); }}
                      className="p-1 text-slate-400"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Tag size={16} className="text-orange-500" />
                      <span className="font-medium">{tag}</span>
                      {DEFAULT_TAGS.includes(tag) && (
                        <span className="text-[8px] uppercase font-black tracking-widest bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-400">Default</span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingTag(tag); setNewTagName(tag); }}
                        className="p-2 text-slate-400 hover:text-orange-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tag)}
                        className="p-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {isAdding ? (
              <div className="p-4 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="New tag name..."
                  className="flex-1 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button 
                  onClick={handleAdd}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold"
                >
                  Add
                </button>
                <button 
                  onClick={() => { setIsAdding(false); setNewTagName(''); }}
                  className="p-2 text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full p-4 flex items-center gap-3 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-colors"
              >
                <Plus size={20} />
                <span className="font-bold">Create New Tag</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      <p className="px-4 text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed uppercase tracking-widest font-bold text-center">
        Note: Renaming or deleting tags will affect all recipes using them. Default tags cannot be permanently deleted but can be removed from recipes.
      </p>
    </div>
  );
}
