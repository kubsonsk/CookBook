import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Recipe, Label } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChefHat, LayoutGrid, List, Loader2, Search, Tag as TagIcon, ArrowUp, Trash2, X, CheckSquare, Copy, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatTime, getLocalStorageItem, setLocalStorageItem } from '../lib/utils';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeListItem } from '../components/RecipeListItem';
import { RecipeLabelModal } from '../components/RecipeLabelModal';
import { useOnlineStatus } from '../lib/hooks';
import { useLanguage } from '../lib/LanguageContext';
import { ContextMenu } from '../components/ContextMenu';
import { ConfirmModal } from '../components/ConfirmModal';

export default function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(
    (getLocalStorageItem('recipeViewMode') as 'card' | 'list') || 'card'
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Selection & Context Menu State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; recipeId: string | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    recipeId: null
  });
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [recipeForLabels, setRecipeForLabels] = useState<Recipe | null>(null);

  const scrollToTop = () => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
      sessionStorage.setItem('homeScrollPos', '0');
    }
  };

  useEffect(() => {
    const mainElement = document.querySelector('main');
    const handleScroll = (e: any) => {
      // Only save if we are actually on the home page
      if (window.location.pathname !== '/') return;
      
      const scrollY = e.target.scrollTop;
      setIsScrolled(scrollY > 150);
      // Save scroll position for Home page
      sessionStorage.setItem('homeScrollPos', scrollY.toString());
    };

    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after loading recipes
  useEffect(() => {
    if (!loading) {
      const savedPos = sessionStorage.getItem('homeScrollPos');
      if (savedPos) {
        const mainElement = document.querySelector('main');
        if (mainElement) {
          // Small delay to ensure browser has finished layout
          const timeoutId = setTimeout(() => {
            mainElement.scrollTo({ top: parseInt(savedPos), behavior: 'instant' });
          }, 50);
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [loading]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const qRecipes = query(
      collection(db, 'recipes'),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeRecipes = onSnapshot(qRecipes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(data);
      setLoading(false);
      setIsSyncing(snapshot.metadata.hasPendingWrites);
    });

    const qLabels = query(
      collection(db, 'labels'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribeLabels = onSnapshot(qLabels, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Label));
      // Sort in-memory alphabetically by name for the filter bar
      data.sort((a, b) => a.name.localeCompare(b.name));
      setLabels(data);
    });

    return () => {
      unsubscribeRecipes();
      unsubscribeLabels();
    };
  }, []);

  useEffect(() => {
    setLocalStorageItem('recipeViewMode', viewMode);
  }, [viewMode]);

  const toggleLabel = (labelName: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelName) 
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLabels = selectedLabels.length === 0 || 
      selectedLabels.every(label => r.labels?.includes(label));
    
    return matchesSearch && matchesLabels;
  });

  const toggleRecipeSelection = (id: string) => {
    setSelectedRecipeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setIsSelectionMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleLongPress = (id: string, x: number, y: number) => {
    if (isSelectionMode) return;
    setContextMenu({ isOpen: true, x, y, recipeId: id });
  };

  const handleBulkDelete = async () => {
    if (selectedRecipeIds.size === 0) return;
    setIsDeletingBulk(true);
    try {
      const batch = writeBatch(db);
      selectedRecipeIds.forEach(id => {
        batch.delete(doc(db, 'recipes', id));
      });
      await batch.commit();
      setSelectedRecipeIds(new Set());
      setIsSelectionMode(false);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting recipes:", error);
      alert(t('failed_delete_recipe'));
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 pb-32"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight text-slate-800 dark:text-zinc-100">
                {t('all_recipes')}
              </h2>
              {isSyncing && isOnline && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-full animate-pulse">
                  <Loader2 size={10} className="animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('syncing')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className={cn(
                  "p-2 rounded-full transition-all relative",
                  isSearchVisible ? "bg-primary-100 text-primary-500" : "text-slate-400 hover:text-primary-500"
                )}
              >
                <Search size={20} />
                {(searchTerm || selectedLabels.length > 0) && !isSearchVisible && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full border-2 border-slate-50 dark:border-zinc-950" />
                )}
              </button>
              <div className="flex gap-2 p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    viewMode === 'card'
                      ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                      : "text-slate-400 hover:text-primary-500"
                  )}
                  aria-label={t('view_cards')}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-full transition-all",
                    viewMode === 'list'
                      ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                      : "text-slate-400 hover:text-primary-500"
                  )}
                  aria-label={t('view_list')}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Search Area (Top of screen when active) */}
        <AnimatePresence>
          {isSearchVisible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "z-40 space-y-4 transition-all duration-300",
                isScrolled ? "fixed top-0 left-0 right-0 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-lg p-4 shadow-lg border-b border-slate-200 dark:border-zinc-800" : "relative"
              )}
            >
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary-500/20 outline-none font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {isScrolled && (
                    <button 
                      onClick={() => setIsSearchVisible(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400"
                    >
                      <Plus size={20} className="rotate-45" />
                    </button>
                  )}
                </div>
                
                {labels.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                    {labels.map(label => (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.name)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap flex items-center gap-1.5",
                          selectedLabels.includes(label.name)
                            ? "bg-primary-500 text-white border-primary-500"
                            : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400"
                        )}
                      >
                        <TagIcon size={10} />
                        {label.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Buttons */}
      <div className={cn(
        "fixed right-6 z-50 flex flex-col gap-3 items-center transition-all duration-300",
        isSelectionMode ? "bottom-36" : "bottom-24"
      )}>
        <AnimatePresence>
          {isScrolled && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={scrollToTop}
              className="p-3 bg-white dark:bg-zinc-900 text-primary-500 rounded-full shadow-xl border border-slate-100 dark:border-zinc-800 hover:scale-110 active:scale-95 transition-transform"
              aria-label={t('scroll_top')}
            >
              <ArrowUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isScrolled && !isSearchVisible && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => {
                setIsSearchVisible(true);
                // Small delay to let the input mount before focus
                setTimeout(() => {
                  document.querySelector('input')?.focus();
                }, 100);
              }}
              className="p-4 bg-primary-500 text-white rounded-full shadow-2xl shadow-primary-500/40 hover:scale-110 active:scale-95 transition-transform relative"
              aria-label={t('search_recipes')}
            >
              <Search size={24} />
              {(searchTerm || selectedLabels.length > 0) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-black">
                  !
                </div>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-3xl animate-pulse border border-slate-100 dark:border-zinc-800" />
          ))
        ) : filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => (
            viewMode === 'card' ? (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                index={index}
                isSelectionMode={isSelectionMode}
                isSelected={selectedRecipeIds.has(recipe.id)}
                onSelect={toggleRecipeSelection}
                onLongPress={handleLongPress}
              />
            ) : (
              <RecipeListItem 
                key={recipe.id} 
                recipe={recipe} 
                index={index}
                isSelectionMode={isSelectionMode}
                isSelected={selectedRecipeIds.has(recipe.id)}
                onSelect={toggleRecipeSelection}
                onLongPress={handleLongPress}
              />
            )
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
            <p className="text-slate-400 dark:text-zinc-500">{t('no_recipes')}</p>
            {(searchTerm || selectedLabels.length > 0) ? (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedLabels([]); }}
                className="mt-4 text-primary-500 font-bold uppercase tracking-widest text-xs"
              >
                {t('clear_filters')}
              </button>
            ) : (
              <Link to="/add" className="mt-4 inline-flex items-center gap-2 text-primary-500 font-medium">
                <Plus size={18} />
                {t('add_first_recipe')}
              </Link>
            )}
          </div>
        )}
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        items={[
          {
            label: t('manage_labels'),
            icon: <Tag size={18} />,
            onClick: () => {
              const recipe = recipes.find(r => r.id === contextMenu.recipeId);
              if (recipe) {
                setRecipeForLabels(recipe);
                setIsLabelModalOpen(true);
              }
            }
          },
          {
            label: t('duplicate'),
            icon: <Copy size={18} />,
            onClick: () => {
              const recipeToDuplicate = recipes.find(r => r.id === contextMenu.recipeId);
              if (recipeToDuplicate) {
                navigate('/add', { state: { initialRecipe: recipeToDuplicate } });
              }
            }
          },
          {
            label: t('select'),
            icon: <CheckSquare size={18} />,
            onClick: () => {
              if (contextMenu.recipeId) {
                setIsSelectionMode(true);
                setSelectedRecipeIds(new Set([contextMenu.recipeId]));
              }
            }
          }
        ]}
      />

      <RecipeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => {
          setIsLabelModalOpen(false);
          setRecipeForLabels(null);
        }}
        recipe={recipeForLabels}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        isLoading={isDeletingBulk}
        title={t('delete_selected')}
        description={
          <div className="space-y-2">
            <p>{t('delete_selected_confirm', { count: selectedRecipeIds.size })}</p>
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{t('bulk_delete_warning')}</p>
          </div>
        }
      />

      {/* Selection Mode Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-6 right-6 z-[60] bg-slate-900 dark:bg-zinc-800 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-slate-700 dark:border-zinc-700"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedRecipeIds(new Set());
                }}
                className="p-2 hover:bg-slate-800 dark:hover:bg-zinc-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t('selected_count', { count: selectedRecipeIds.size })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">{t('delete_selected')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
