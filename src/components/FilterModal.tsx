import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react'; // Import Search icon
import { CATEGORIES } from '../types';
import { cn } from '../lib/utils';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  onSelectCategory: (category: string | null) => void;
  searchTerm: string; // New prop for search term
  onSearchTermChange: (term: string) => void; // New prop for search term change
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  selectedCategories,
  onSelectCategory,
  searchTerm, // Destructure new prop
  onSearchTermChange, // Destructure new prop
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100vh" }}
            animate={{ y: 0 }}
            exit={{ y: "100vh" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Filter Recipes</h2>
              <div className="flex gap-2">
                {(searchTerm || selectedCategories.length > 0) && (
                  <button
                    onClick={() => {
                      onSearchTermChange('');
                      onSelectCategory(null);
                    }}
                    className="text-sm font-medium text-orange-500 hover:text-orange-600 px-2 py-1"
                  >
                    Clear all
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Search Bar inside Modal */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search recipes or ingredients..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-shadow"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => { onSelectCategory(null); }} // Removed onClose here, user might want to search
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategories.length === 0
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
                )}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => { onSelectCategory(cat); }} // Removed onClose here
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    selectedCategories.includes(cat)
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

