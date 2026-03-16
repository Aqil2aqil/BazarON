import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 bg-slate-900/90 backdrop-blur-md border border-neon-purple/50 rounded-2xl shadow-[0_0_20px_rgba(176,38,255,0.3)] min-w-[300px]"
        >
          <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-neon-purple" />
          </div>
          <p className="text-white font-bold text-sm flex-1">{message}</p>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
