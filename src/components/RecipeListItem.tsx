import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ChefHat, Clock, Tag, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { Recipe } from '../types';
import { formatTime, cn } from '../lib/utils';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLanguage } from '../lib/LanguageContext';
import { useLongPress } from '../lib/hooks';
import { ConfirmModal } from './ConfirmModal';

interface RecipeListItemProps {
  recipe: Recipe;
  index: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string, x: number, y: number) => void;
}

export const RecipeListItem: React.FC<RecipeListItemProps> = ({ 
  recipe, 
  index,
  isSelectionMode,
  isSelected,
  onSelect,
  onLongPress
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const controls = useAnimation();
  const x = useMotionValue(0);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // iPhone-style color expansion and icon scaling
  const editWidth = useTransform(x, [0, 80, 300], [0, 80, 300]);
  const deleteWidth = useTransform(x, [-300, -80, 0], [300, 80, 0]);
  
  const editOpacity = useTransform(x, [0, 40], [0, 1]);
  const deleteOpacity = useTransform(x, [-40, 0], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (isSelectionMode) {
      controls.start({ x: 0 });
      return;
    }
    const { offset, velocity } = info;
    
    // Thresholds
    const swipeThreshold = 80;
    const longSwipeThreshold = 200;

    if (offset.x > longSwipeThreshold || (offset.x > swipeThreshold && velocity.x > 500)) {
      // Long swipe right -> Edit
      navigate(`/edit/${recipe.id}`);
      controls.start({ x: 0 });
    } else if (offset.x < -longSwipeThreshold || (offset.x < -swipeThreshold && velocity.x < -500)) {
      // Long swipe left -> Delete
      setShowDeleteConfirm(true);
      controls.start({ x: -swipeThreshold });
    } else if (offset.x > swipeThreshold) {
      // Short swipe right -> Reveal Edit
      controls.start({ x: swipeThreshold });
    } else if (offset.x < -swipeThreshold) {
      // Short swipe left -> Reveal Delete
      controls.start({ x: -swipeThreshold });
    } else {
      // Reset
      controls.start({ x: 0 });
    }
  };

  const handleDelete = async () => {
    if (!recipe.id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'recipes', recipe.id));
      if (isMounted.current) {
        setShowDeleteConfirm(false);
        controls.start({ x: 0 });
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      if (isMounted.current) {
        alert(t('failed_delete_recipe'));
      }
    } finally {
      if (isMounted.current) {
        setIsDeleting(false);
      }
    }
  };

  const longPressProps = useLongPress(
    (e) => {
      const touch = e.touches ? e.touches[0] : e;
      onLongPress?.(recipe.id!, touch.clientX, touch.clientY);
    },
    () => {
      if (isSelectionMode) {
        onSelect?.(recipe.id!);
      } else {
        navigate(`/recipe/${recipe.id}`);
      }
    }
  );

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800">
        {!isSelectionMode && (
          <div className="absolute inset-0 flex justify-between items-stretch">
            {/* Edit Action (Left) */}
            <motion.button 
              style={{ width: editWidth, opacity: editOpacity }}
              onClick={() => {
                navigate(`/edit/${recipe.id}`);
                controls.start({ x: 0 });
              }}
              className="absolute left-0 top-0 bottom-0 bg-blue-500 flex items-center justify-end overflow-hidden cursor-pointer"
            >
              <div className="w-20 h-full flex flex-col items-center justify-center text-white">
                <Edit2 size={24} />
                <span className="text-[10px] font-black uppercase mt-1">{t('edit')}</span>
              </div>
            </motion.button>

            {/* Delete Action (Right) */}
            <motion.button 
              style={{ width: deleteWidth, opacity: deleteOpacity }}
              onClick={() => setShowDeleteConfirm(true)}
              className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center justify-start overflow-hidden cursor-pointer"
            >
              <div className="w-20 h-full flex flex-col items-center justify-center text-white">
                <Trash2 size={24} />
                <span className="text-[10px] font-black uppercase mt-1">{t('delete')}</span>
              </div>
            </motion.button>
          </div>
        )}

        <motion.div
          drag={isSelectionMode ? false : "x"}
          dragConstraints={{ left: -300, right: 300 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x }}
          {...longPressProps}
          className={cn(
            "relative z-10 bg-white dark:bg-zinc-900 transition-all cursor-pointer select-none touch-pan-y",
            isSelected && "opacity-60 translate-x-4"
          )}
        >
          <div className="group relative flex items-center p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.99] min-h-[72px]">
            {isSelectionMode && (
              <div className="mr-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
                  isSelected ? "bg-primary-500 border-primary-500 text-white" : "border-slate-200 dark:border-zinc-700 bg-transparent"
                )}>
                  {isSelected && <CheckCircle2 size={16} />}
                </div>
              </div>
            )}
            
            <div className="w-16 h-16 flex-shrink-0 mr-3 rounded-lg overflow-hidden border border-slate-100 dark:border-zinc-800">
              {recipe.heroImageUrl ? (
                <img
                  src={recipe.heroImageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-500 text-xs">
                  <ChefHat size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary-500 transition-colors">
                {recipe.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-zinc-500">
                {recipe.prepTime && (
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{formatTime(recipe.prepTime)}</span>
                  </div>
                )}
                {recipe.labels && recipe.labels.length > 0 && (
                  <div className="flex gap-1 overflow-hidden">
                    {recipe.labels.slice(0, 1).map(l => (
                      <span key={l} className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Tag size={8} className="text-primary-500" />
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          controls.start({ x: 0 });
        }}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t('delete_recipe')}
        description={
          <>
            {t('delete_confirm_title')} <span className="font-bold text-slate-900 dark:text-white">"{recipe.title}"</span>? {t('delete_confirm_undone')}
          </>
        }
      />
    </>
  );
};
