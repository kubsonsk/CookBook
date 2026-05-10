import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmIcon?: React.ReactNode;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmIcon,
  isLoading,
  variant = 'danger'
}: ConfirmModalProps) {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 border border-slate-100 dark:border-zinc-800"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                variant === 'danger' 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-500'
              }`}>
                {confirmIcon || <AlertTriangle size={32} />}
              </div>
              <h3 className={`text-xl font-black uppercase tracking-tight ${
                variant === 'danger' ? 'text-red-600' : 'text-primary-600'
              }`}>
                {title}
              </h3>
              <div className="text-sm text-slate-500 dark:text-zinc-400">
                {description}
              </div>
            </div>

            <div className="grid gap-3">
              <button
                disabled={isLoading}
                onClick={onConfirm}
                className={`w-full py-4 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 ${
                  variant === 'danger' ? 'bg-red-500' : 'bg-primary-500'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : (confirmIcon || <Trash2 size={18} />)}
                {confirmLabel || t('confirm')}
              </button>
              <button
                disabled={isLoading}
                onClick={onClose}
                className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-2xl font-bold text-sm"
              >
                {t('cancel')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
