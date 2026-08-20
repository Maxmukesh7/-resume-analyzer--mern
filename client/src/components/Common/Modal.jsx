import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#08090B]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`w-full ${sizes[size]} bg-[#121519] border border-[#292D33] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative z-10 overflow-hidden text-[#F5F5F5] ${className}`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#292D33] flex items-center justify-between">
              {title && <h3 className="text-lg font-bold text-[#F5F5F5] tracking-wide">{title}</h3>}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#A7ADB7] hover:text-[#F5F5F5] hover:bg-[#171A1F] transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[75vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
