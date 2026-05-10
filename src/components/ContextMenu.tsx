import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  position: { x: number; y: number };
}

export function ContextMenu({ isOpen, onClose, items, position }: ContextMenuProps) {
  const { t } = useLanguage();
  const [canClose, setCanClose] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setCanClose(true), 100);
      return () => clearTimeout(timer);
    } else {
      setCanClose(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ 
              left: Math.min(position.x, window.innerWidth - 200), 
              top: Math.min(position.y, window.innerHeight - (items.length * 60) - 100) 
            }}
            className="fixed z-[100] min-w-[180px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden"
          >
            <div className="py-2">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                    item.variant === 'danger'
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
