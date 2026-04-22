import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Clock } from 'lucide-react';
import { Recipe } from '../types';
import { formatTime } from '../lib/utils';

interface RecipeListItemProps {
  recipe: Recipe;
  index: number;
}

export const RecipeListItem: React.FC<RecipeListItemProps> = ({ recipe, index }) => (
  <Link to={`/recipe/${recipe.id}`}>
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative flex items-center p-3 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-all active:scale-[0.99] min-h-[72px]"
    >
      <div className="w-16 h-16 flex-shrink-0 mr-3 rounded-lg overflow-hidden">
        {recipe.heroImageUrl ? (
          <img
            src={recipe.heroImageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500 text-xs">
            <ChefHat size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-zinc-500">
          {recipe.prepTime && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatTime(recipe.prepTime)}</span>
            </div>
          )}
          {recipe.categories && recipe.categories.length > 0 && (
            <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500">
              {recipe.categories[0]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  </Link>
);