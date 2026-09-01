import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useHealthStore } from '../store';

export const GlobalConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirmModal, elderMode } = useHealthStore();

  if (!confirmModal) return null;

  const handleConfirm = async () => {
    try {
      await confirmModal.onConfirm();
    } finally {
      closeConfirmModal();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative overflow-hidden ${
            elderMode ? 'p-7' : 'p-6'
          }`}
        >
          <div className="flex items-start space-x-3.5 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className={`font-bold text-gray-900 ${elderMode ? 'text-xl' : 'text-lg'}`}>
                {confirmModal.title}
              </h3>
              <p className={`text-gray-500 mt-1.5 leading-relaxed ${elderMode ? 'text-base' : 'text-sm'}`}>
                {confirmModal.content}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => {
                if (confirmModal.onCancel) confirmModal.onCancel();
                closeConfirmModal();
              }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors active:scale-98 ${
                elderMode ? 'text-base py-3.5' : 'text-sm'
              }`}
            >
              {confirmModal.cancelText || '取消'}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white shadow-md shadow-red-200 transition-all active:scale-98 ${
                confirmModal.confirmColor ? confirmModal.confirmColor : 'bg-[#EF4444] hover:bg-red-600'
              } ${elderMode ? 'text-base py-3.5' : 'text-sm'}`}
            >
              {confirmModal.confirmText || '确认'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
