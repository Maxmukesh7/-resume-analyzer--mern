import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const icons = {
    success: <FaCheckCircle className="text-emerald-400" size={18} />,
    error: <FaExclamationCircle className="text-red-400" size={18} />,
    warning: <FaExclamationTriangle className="text-amber-400" size={18} />,
    info: <FaInfoCircle className="text-blue-400" size={18} />
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-slate-900/90 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    error: 'border-red-500/20 bg-slate-900/90 shadow-[0_4px_20px_rgba(239,68,68,0.15)]',
    warning: 'border-amber-500/20 bg-slate-900/90 shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
    info: 'border-blue-500/20 bg-slate-900/90 shadow-[0_4px_20px_rgba(59,130,246,0.15)]'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-center justify-between gap-4 p-4 border rounded-2xl backdrop-blur-md ${borderColors[toast.type]}`}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm font-medium text-slate-200">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <FaTimes size={12} />
      </button>
    </motion.div>
  );
}
