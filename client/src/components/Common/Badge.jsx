export default function Badge({
  children,
  variant = 'info',
  className = ''
}) {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-[#4ADE80] font-bold',
    warning: 'bg-[#F5B83D]/10 border-[#F5B83D]/30 text-[#F5B83D] font-bold',
    danger: 'bg-rose-500/10 border-rose-500/30 text-[#F87171] font-bold',
    info: 'bg-blue-500/10 border-blue-500/30 text-[#60A5FA] font-bold',
    purple: 'bg-[#F5B83D]/10 border-[#F5B83D]/30 text-[#FFD166] font-bold',
    gold: 'bg-[#F5B83D]/10 border-[#F5B83D]/30 text-[#FFD166] font-bold',
    slate: 'bg-[#0D0F12] border-[#292D33] text-[#A7ADB7] font-bold'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border backdrop-blur-md transition-colors ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
