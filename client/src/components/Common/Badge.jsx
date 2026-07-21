export default function Badge({
  children,
  variant = 'info',
  className = ''
}) {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    slate: 'bg-slate-700/30 border-slate-700/50 text-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
