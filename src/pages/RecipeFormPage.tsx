import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Recipe, Ingredient, Step, DEFAULT_TAGS } from '../types';
import { 
  ArrowLeft, Plus, Trash2, Image as ImageIcon, Video, 
  Sparkles, Loader2, Save, X, AlertTriangle
} from 'lucide-react';
import { extractRecipeFromUrl } from '../lib/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecipeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sharedUrl = searchParams.get('url') || searchParams.get('text') || location.state?.importUrl || '';

  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicUrl, setMagicUrl] = useState(sharedUrl);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TAGS);
  
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [serverVersion, setServerVersion] = useState<Recipe | null>(null);

  const [recipe, setRecipe] = useState<Partial<Recipe>>({
    title: '',
    servings: 2,
    prepTime: 30,
    tags: [],
    ingredients: [{ name: '', amount: 0, unit: 'g' }],
    steps: [{ text: '' }],
  });
  
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState<any>(null);

  useEffect(() => {
    const fetchAvailableTags = async () => {
      if (!auth.currentUser) return;
      const q = query(collection(db, 'recipes'), where('ownerId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const tags = new Set<string>(DEFAULT_TAGS);
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Recipe;
        (data.tags || []).forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags).sort());
    };
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    if (isEdit) {
      const fetchRecipe = async () => {
        const docRef = doc(db, 'recipes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Recipe;
          setRecipe(data);
          setOriginalUpdatedAt(data.updatedAt);
        }
      };
      fetchRecipe();
    }
  }, [id, isEdit]);

  const handleMagicAdd = async () => {
    if (!magicUrl) return;
    setMagicLoading(true);
    try {
      const data = await extractRecipeFromUrl(magicUrl);
      if (data) {
        setRecipe(prev => ({
          ...prev,
          ...data,
          tags: data.tags || [],
          ingredients: data.ingredients || [{ name: '', amount: 0, unit: 'g' }],
          steps: data.steps || [{ text: '' }],
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to extract recipe. Please check the URL.');
    } finally {
      setMagicLoading(false);
    }
  };

  const performSave = async (data: any) => {
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'recipes', id), data);
      } else {
        await addDoc(collection(db, 'recipes'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save recipe. It will be synced when you are back online.');
      navigate('/'); // Still navigate away as Firestore handles offline queue
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!recipe.title || !auth.currentUser) return;

    setLoading(true);
    const recipeData = {
      ...recipe,
      ownerId: auth.currentUser.uid,
      updatedAt: serverTimestamp(),
    };

    if (isEdit && navigator.onLine) {
      try {
        const docRef = doc(db, 'recipes', id);
        const serverSnap = await getDocFromServer(docRef);
        if (serverSnap.exists()) {
          const serverData = serverSnap.data() as Recipe;
          // Compare updatedAt. If server has a newer version than what we started with
          if (originalUpdatedAt && serverData.updatedAt && serverData.updatedAt.toMillis() > originalUpdatedAt.toMillis()) {
            setServerVersion(serverData);
            setShowConflictModal(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not check server version, proceeding with save', err);
      }
    }

    await performSave(recipeData);
  };

  const handleResolveConflict = async (useServer: boolean) => {
    setShowConflictModal(false);
    if (useServer && serverVersion) {
      setRecipe(serverVersion);
      setOriginalUpdatedAt(serverVersion.updatedAt);
    } else {
      // Use local version (overwrite server)
      setLoading(true);
      const recipeData = {
        ...recipe,
        ownerId: auth.currentUser?.uid,
        updatedAt: serverTimestamp(),
      };
      await performSave(recipeData);
    }
  };

  const addIngredient = () => {
    setRecipe(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name: '', amount: 0, unit: 'g' }]
    }));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const newIngs = [...(recipe.ingredients || [])];
    newIngs[index] = { ...newIngs[index], [field]: value };
    setRecipe({ ...recipe, ingredients: newIngs });
  };

  const removeIngredient = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    setRecipe(prev => ({
      ...prev,
      steps: [...(prev.steps || []), { text: '' }]
    }));
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...(recipe.steps || [])];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setRecipe({ ...recipe, steps: newSteps });
  };

  const removeStep = (index: number) => {
    setRecipe(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index)
    }));
  };

  const toggleTag = (tag: string) => {
    const curTags = recipe.tags || [];
    if (curTags.includes(tag)) {
      setRecipe({ ...recipe, tags: curTags.filter(t => t !== tag) });
    } else {
      setRecipe({ ...recipe, tags: [...curTags, tag] });
    }
  };

  const addCustomTag = () => {
    if (!newTag.trim()) return;
    const tag = newTag.trim();
    if (!availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag].sort());
    }
    toggleTag(tag);
    setNewTag('');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between -mt-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-zinc-400">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black uppercase tracking-tight">{isEdit ? 'Edit Recipe' : 'New Recipe'}</h2>
        <div className="w-10" />
      </div>

      {!isEdit && (
        <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 space-y-3">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Sparkles size={20} />
            <span className="font-bold uppercase tracking-tight text-sm">Magic Import</span>
          </div>
          <p className="text-xs text-orange-800/70 dark:text-orange-300 text-pretty">
            Paste a recipe URL and let AI do the work for you.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://recipe-website.com/..."
              className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900/50 text-sm focus:outline-none"
              value={magicUrl}
              onChange={(e) => setMagicUrl(e.target.value)}
            />
            <button
              disabled={magicLoading}
              onClick={handleMagicAdd}
              className="px-4 py-3 bg-orange-500 text-white rounded-xl disabled:opacity-50"
            >
              {magicLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <section className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Recipe Title</span>
            <input
              type="text"
              required
              placeholder="e.g. Grandma's Apple Pie"
              className="w-full px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-orange-500/20 font-bold text-lg"
              value={recipe.title}
              onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Portions</span>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
                value={recipe.servings}
                onChange={(e) => setRecipe({ ...recipe, servings: parseInt(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Time (min)</span>
              <input
                type="number"
                className="w-full px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
                value={recipe.prepTime}
                onChange={(e) => setRecipe({ ...recipe, prepTime: parseInt(e.target.value) })}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Hero image & Video URL</span>
            <div className="space-y-2">
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="url"
                  placeholder="Image URL"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
                  value={recipe.heroImageUrl || ''}
                  onChange={(e) => setRecipe({ ...recipe, heroImageUrl: e.target.value })}
                />
              </div>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="url"
                  placeholder="Video URL (YouTube)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
                  value={recipe.videoUrl || ''}
                  onChange={(e) => setRecipe({ ...recipe, videoUrl: e.target.value })}
                />
              </div>
            </div>
          </label>
        </section>

        <section className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block">Tags</span>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border",
                  recipe.tags?.includes(tag)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Add custom tag..."
              className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl text-sm font-bold"
            >
              Add
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tight text-lg">Ingredients</h3>
            <button type="button" onClick={addIngredient} className="text-orange-500 p-2"><Plus size={24} /></button>
          </div>
          <div className="space-y-3">
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingredient"
                  className="flex-1 px-3 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  className="w-20 px-3 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(i, 'amount', parseFloat(e.target.value))}
                />
                <select
                  className="w-24 px-3 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="pcs">pcs</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                  <option value="cup">cup</option>
                </select>
                <button type="button" onClick={() => removeIngredient(i)} className="text-red-500 px-2"><X size={20} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tight text-lg">Steps</h3>
            <button type="button" onClick={addStep} className="text-orange-500 p-2"><Plus size={24} /></button>
          </div>
          <div className="space-y-4">
            {recipe.steps?.map((step, i) => (
              <div key={i} className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 relative">
                <button type="button" onClick={() => removeStep(i)} className="absolute top-2 right-2 text-slate-300"><X size={20} /></button>
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-500 flex items-center justify-center font-bold">{i+1}</div>
                   <textarea
                    placeholder="Describe this step..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-sm min-h-[80px]"
                    value={step.text}
                    onChange={(e) => updateStep(i, 'text', e.target.value)}
                  />
                </div>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="url"
                    placeholder="Step image URL (optional)"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-xs"
                    value={step.imageUrl || ''}
                    onChange={(e) => updateStep(i, 'imageUrl', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          {isEdit ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </form>

      <AnimatePresence>
        {showConflictModal && (
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
                <h3 className="text-xl font-black uppercase tracking-tight">Sync Conflict</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  This recipe was updated on the server while you were editing it. Which version do you want to keep?
                </p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={() => handleResolveConflict(true)}
                  className="w-full py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl font-bold text-sm"
                >
                  Use Server Version
                </button>
                <button
                  onClick={() => handleResolveConflict(false)}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
                >
                  Overwrite with My Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
