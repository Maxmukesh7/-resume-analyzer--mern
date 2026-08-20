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
    success: <FaCheckCircle className="text-[#4ADE80]" size={18} />,
    error: <FaExclamationCircle className="text-[#F87171]" size={18} />,
    warning: <FaExclamationTriangle className="text-[#F5B83D]" size={18} />,
    info: <FaInfoCircle className="text-[#60A5FA]" size={18} />
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-[#121519]/95 shadow-[0_4px_20px_rgba(74,222,128,0.2)]',
    error: 'border-rose-500/30 bg-[#121519]/95 shadow-[0_4px_20px_rgba(248,113,113,0.2)]',
    warning: 'border-[#F5B83D]/30 bg-[#121519]/95 shadow-[0_4px_20px_rgba(245,184,61,0.25)]',
    info: 'border-blue-500/30 bg-[#121519]/95 shadow-[0_4px_20px_rgba(96,165,250,0.2)]'
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
        <p className="text-sm font-medium text-[#F5F5F5]">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#171A1F] transition-colors cursor-pointer"
      >
        <FaTimes size={12} />
      </button>
    </motion.div>
  );
}
