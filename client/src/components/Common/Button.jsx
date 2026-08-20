import { motion } from 'framer-motion';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F5B83D]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'text-[#08090B] font-bold bg-gradient-to-r from-[#F5B83D] to-[#FFD166] hover:from-[#e5a82d] hover:to-[#f0c256] shadow-[0_4px_20px_rgba(245,184,61,0.28)] hover:shadow-[0_4px_25px_rgba(245,184,61,0.42)]',
    secondary: 'text-[#F5B83D] bg-[#121519] hover:bg-[#171A1F] border border-[#F5B83D]/40 hover:border-[#F5B83D] hover:shadow-[0_0_15px_rgba(245,184,61,0.18)]',
    outline: 'text-[#A7ADB7] hover:text-[#F5F5F5] bg-transparent border border-[#292D33] hover:border-[#F5B83D]/50 hover:bg-[#F5B83D]/10',
    danger: 'text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.5)]',
    accent: 'text-[#08090B] font-bold bg-gradient-to-r from-[#F5B83D] to-[#B7791F] hover:from-[#FFD166] hover:to-[#F5B83D] shadow-[0_4px_15px_rgba(245,184,61,0.3)]',
    glass: 'text-[#F5F5F5] bg-[#121519]/80 hover:bg-[#171A1F] border border-[#292D33] backdrop-blur-md hover:border-[#F5B83D]/30'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base'
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </motion.button>
  );
}
