import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...props
}) {
  const CardComponent = onClick || hoverEffect ? motion.div : 'div';

  const motionProps = onClick || hoverEffect 
    ? {
        whileHover: { y: -4, shadow: '0 10px 30px -10px rgba(245,184,61,0.18)', borderColor: 'rgba(245,184,61,0.35)' },
        transition: { duration: 0.2 },
        style: { cursor: onClick ? 'pointer' : 'default' }
      }
    : {};

  return (
    <CardComponent
      onClick={onClick}
      className={`bg-[#121519] backdrop-blur-xl border border-[#292D33] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.45)] relative overflow-hidden transition-colors text-[#F5F5F5] ${className}`}
      {...motionProps}
      {...props}
    >
      {/* Decorative inner glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#F5B83D]/[0.01] to-[#FFD166]/[0.02] pointer-events-none" />
      {children}
    </CardComponent>
  );
}
