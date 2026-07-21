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
        whileHover: { y: -4, shadow: '0 10px 30px -10px rgba(79,70,229,0.3)', borderColor: 'rgba(99,102,241,0.2)' },
        transition: { duration: 0.2 },
        style: { cursor: onClick ? 'pointer' : 'default' }
      }
    : {};

  return (
    <CardComponent
      onClick={onClick}
      className={`bg-slate-900/45 backdrop-blur-xl border border-slate-800/85 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden transition-colors ${className}`}
      {...motionProps}
      {...props}
    >
      {/* Decorative inner glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-white/[0.03] pointer-events-none" />
      {children}
    </CardComponent>
  );
}
