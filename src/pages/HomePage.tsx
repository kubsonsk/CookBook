import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Recipe, CATEGORIES } from '../types';
import { Link } from 'react-router-dom';
import { Clock, Star, Plus, ChefHat, LayoutGrid, List, Filter } from 'lucide-react'; // Removed Search icon import
import { motion } from 'framer-motion';
import { cn, formatTime, getLocalStorageItem, setLocalStorageItem } from '../lib/utils';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeListItem } from '../components/RecipeListItem';
import { FilterModal } from '../components/FilterModal';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(
    (getLocalStorageItem('recipeViewMode') as 'card' | 'list') || 'card'
  );
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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

  useEffect(() => {
    setLocalStorageItem('recipeViewMode', viewMode);
  }, [viewMode]);

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || r.categories?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Removed the search bar div entirely */}

        {/* View Toggle - positioned below search bar, above recipe list */}
        <div className="flex justify-between items-center mt-4">
          <h2 className="text-xl font-bold uppercase tracking-tight text-slate-800 dark:text-zinc-100">
            All Recipes
          </h2>
          <div className="flex gap-2 p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                "p-1.5 rounded-full transition-all",
                viewMode === 'card'
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-orange-500"
              )}
              aria-label="Show as cards"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-full transition-all",
                viewMode === 'list'
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-slate-400 hover:text-orange-500"
              )}
              aria-label="Show as list"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-3xl animate-pulse border border-slate-100 dark:border-zinc-800" />
          ))
        ) : filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => (
            viewMode === 'card' ? (
              <RecipeCard key={recipe.id} recipe={recipe} index={index} />
            ) : (
              <RecipeListItem key={recipe.id} recipe={recipe} index={index} />
            )
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

      {/* Floating Filter Button */}
      <button
        onClick={() => setIsFilterModalOpen(true)}
        className="fixed bottom-20 right-6 p-4 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors z-40" // Changed bottom-6 to bottom-20
        aria-label="Open filter options"
      >
        <Filter size={24} />
      </button>

      {/* Filter Modal - passing searchTerm and setSearchTerm */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />
    </div>
  );
}

