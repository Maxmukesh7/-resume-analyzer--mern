export default function LoadingSpinner({ size = 'md', className = '', fullPage = false }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };

  const spinner = (
    <div className={`relative ${className}`}>
      <div className={`animate-spin rounded-full border-t-transparent border-slate-800 ${sizes[size]}`}></div>
      <div className={`absolute top-0 left-0 animate-spin rounded-full border-b-transparent border-l-transparent border-r-transparent border-t-blue-500 ${sizes[size]}`} style={{ animationDuration: '0.8s' }}></div>
      <div className={`absolute top-0 left-0 animate-spin rounded-full border-t-transparent border-l-transparent border-r-transparent border-b-purple-500 ${sizes[size]}`} style={{ animationDuration: '1.2s' }}></div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
