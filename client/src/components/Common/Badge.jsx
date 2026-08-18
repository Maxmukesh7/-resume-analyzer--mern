export default function Badge({
  children,
  variant = 'info',
  className = ''
}) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 font-bold',
    warning: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 font-bold',
    danger: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400 font-bold',
    info: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400 font-bold',
    purple: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400 font-bold',
    slate: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:border-slate-700/50 dark:text-slate-400 font-bold'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border backdrop-blur-md transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
