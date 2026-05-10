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

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onLongPress?: (id: string, x: number, y: number) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
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

  const editWidth = useTransform(x, [0, 100, 400], [0, 100, 400]);
  const deleteWidth = useTransform(x, [-400, -100, 0], [400, 100, 0]);
  
  const editOpacity = useTransform(x, [0, 50], [0, 1]);
  const deleteOpacity = useTransform(x, [-50, 0], [1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (isSelectionMode) {
      controls.start({ x: 0 });
      return;
    }
    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const longSwipeThreshold = 250;

    if (offset.x > longSwipeThreshold || (offset.x > swipeThreshold && velocity.x > 500)) {
      navigate(`/edit/${recipe.id}`);
      controls.start({ x: 0 });
    } else if (offset.x < -longSwipeThreshold || (offset.x < -swipeThreshold && velocity.x < -500)) {
      setShowDeleteConfirm(true);
      controls.start({ x: -swipeThreshold });
    } else if (offset.x > swipeThreshold) {
      controls.start({ x: swipeThreshold });
    } else if (offset.x < -swipeThreshold) {
      controls.start({ x: -swipeThreshold });
    } else {
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
      <div className="relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800">
        {!isSelectionMode && (
          <div className="absolute inset-0 flex justify-between items-stretch">
            <motion.button 
              style={{ width: editWidth, opacity: editOpacity }}
              onClick={() => {
                navigate(`/edit/${recipe.id}`);
                controls.start({ x: 0 });
              }}
              className="absolute left-0 top-0 bottom-0 bg-blue-500 flex items-center justify-center overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center text-white">
                <Edit2 size={32} />
                <span className="text-xs font-black uppercase mt-2">{t('edit')}</span>
              </div>
            </motion.button>

            <motion.button 
              style={{ width: deleteWidth, opacity: deleteOpacity }}
              onClick={() => setShowDeleteConfirm(true)}
              className="absolute right-0 top-0 bottom-0 bg-red-500 flex items-center justify-center overflow-hidden cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center text-white">
                <Trash2 size={32} />
                <span className="text-xs font-black uppercase mt-2">{t('delete')}</span>
              </div>
            </motion.button>
          </div>
        )}

        <motion.div
          drag={isSelectionMode ? false : "x"}
          dragConstraints={{ left: -400, right: 400 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x }}
          {...longPressProps}
          className={cn(
            "relative z-10 bg-white dark:bg-zinc-900 transition-all cursor-pointer select-none touch-pan-y",
            isSelected && "opacity-60 scale-[0.98]"
          )}
        >
          <div className="group relative flex flex-col transition-all active:scale-[0.98]">
            <div className="w-full h-48 flex-shrink-0 relative overflow-hidden">
              {recipe.heroImageUrl ? (
                <img
                  src={recipe.heroImageUrl}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center text-primary-500">
                  <ChefHat size={48} />
                </div>
              )}
              
              {/* Selection Overlay */}
              <AnimatePresence>
                {isSelectionMode && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary-500/40" : "bg-black/10"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform",
                      isSelected ? "bg-white text-primary-500 scale-110" : "bg-white/80 text-slate-400 scale-100"
                    )}>
                      <CheckCircle2 size={32} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary-500 transition-colors uppercase tracking-tight">
                  {recipe.title}
                </h3>
                {recipe.labels && recipe.labels.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {recipe.labels.slice(0, 2).map(l => (
                      <span key={l} className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Tag size={8} className="text-primary-500" />
                        {l}
                      </span>
                    ))}
                    {recipe.labels.length > 2 && (
                      <span className="text-[10px] text-slate-400">+{recipe.labels.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-zinc-500 mt-3">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{recipe.prepTime ? formatTime(recipe.prepTime) : 'N/A'}</span>
                </div>
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
            {t('delete_confirm_title')} <span className="font-bold text-slate-900 dark:text-white">"{recipe.title}"</span>?
          </>
        }
      />
    </>
  );
};
