import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, FileDown, Calendar, Sparkles, X, ShieldCheck } from 'lucide-react';
import { useHealthStore } from '../store';

export const GlobalPlaceholderSheet: React.FC = () => {
  const { placeholderSheet, closePlaceholderSheet, elderMode } = useHealthStore();

  if (!placeholderSheet) return null;

  const renderIcon = () => {
    switch (placeholderSheet.iconName) {
      case 'pill':
        return <Pill className="w-8 h-8 text-teal-600" />;
      case 'export':
        return <FileDown className="w-8 h-8 text-teal-600" />;
      case 'calendar':
        return <Calendar className="w-8 h-8 text-teal-600" />;
      default:
        return <Sparkles className="w-8 h-8 text-teal-600" />;
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs"
        onClick={closePlaceholderSheet}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl relative ${
            elderMode ? 'p-8' : 'p-6'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top handle bar */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

          <button 
            onClick={closePlaceholderSheet}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 flex items-center justify-center mb-4 border border-teal-100 shadow-inner">
              {renderIcon()}
            </div>

            <h3 className={`font-bold text-gray-900 mb-2 ${elderMode ? 'text-2xl' : 'text-xl'}`}>
              {placeholderSheet.title}
            </h3>

            <p className={`text-gray-500 mb-8 max-w-xs leading-relaxed ${elderMode ? 'text-base' : 'text-sm'}`}>
              {placeholderSheet.description}
            </p>

            <button
              onClick={closePlaceholderSheet}
              className={`w-full py-3.5 rounded-2xl font-bold bg-[#0D9488] text-white shadow-lg shadow-teal-100 hover:bg-teal-700 active:scale-98 transition-all ${
                elderMode ? 'text-lg py-4' : 'text-base'
              }`}
            >
              知道了
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
