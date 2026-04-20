import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Recipe, CATEGORIES } from '../types';
import { Link } from 'react-router-dom';
import { Search, Clock, Star, Plus, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatTime } from '../lib/utils';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'recipes'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || r.categories?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search recipes or ingredients..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              !selectedCategory 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === cat
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-3xl animate-pulse border border-slate-100 dark:border-zinc-800" />
          ))
        ) : filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => (
            <Link key={recipe.id} to={`/recipe/${recipe.id}`}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-all active:scale-[0.98] h-32"
              >
                <div className="w-32 h-full flex-shrink-0">
                  {recipe.heroImageUrl ? (
                    <img 
                      src={recipe.heroImageUrl} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500">
                      <ChefHat size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors uppercase tracking-tight">
                      {recipe.title}
                    </h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {recipe.categories?.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{recipe.prepTime ? formatTime(recipe.prepTime) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
            <p className="text-slate-400 dark:text-zinc-500">No recipes found.</p>
            <Link to="/add" className="mt-4 inline-flex items-center gap-2 text-orange-500 font-medium">
              <Plus size={18} />
              Add your first recipe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
