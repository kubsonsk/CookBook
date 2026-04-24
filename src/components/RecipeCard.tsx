import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Clock, Tag } from 'lucide-react';
import { Recipe } from '../types';
import { formatTime } from '../lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index }) => (
  <Link to={`/recipe/${recipe.id}`}>
    <motion.div
      initial={{ opacity: 0, y: -10 }} // Adjusted animation for vertical entry
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-zinc-800 hover:border-orange-500/30 dark:hover:border-orange-500/30 transition-all active:scale-[0.98]" // Changed flex to flex-col, removed h-32
    >
      <div className="w-full h-48 flex-shrink-0"> {/* Image on top, full width, fixed height */}
        {recipe.heroImageUrl ? (
          <img
            src={recipe.heroImageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-500">
            <ChefHat size={48} /> {/* Increased icon size for larger card */}
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between"> {/* Content below image */}
        <div>
          <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors uppercase tracking-tight">
            {recipe.title}
          </h3>
          {recipe.labels && recipe.labels.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {recipe.labels.slice(0, 2).map(l => (
                <span key={l} className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Tag size={8} className="text-orange-500" />
                  {l}
                </span>
              ))}
              {recipe.labels.length > 2 && (
                <span className="text-[10px] text-slate-400">+{recipe.labels.length - 2}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500 mt-3"> {/* Added mt-3 for spacing */}
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{recipe.prepTime ? formatTime(recipe.prepTime) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  </Link>
);