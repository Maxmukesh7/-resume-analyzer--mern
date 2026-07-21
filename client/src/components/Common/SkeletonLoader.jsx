export default function SkeletonLoader({
  type = 'text',
  rows = 3,
  className = ''
}) {
  const baseClass = 'bg-slate-800/40 animate-pulse rounded-lg';

  if (type === 'circle') {
    return <div className={`rounded-full ${baseClass} ${className}`} />;
  }

  if (type === 'card') {
    return (
      <div className={`p-6 border border-slate-800/50 bg-slate-900/25 rounded-2xl flex flex-col gap-4 ${className}`}>
        <div className={`h-8 w-1/3 ${baseClass}`} />
        <div className="flex flex-col gap-2">
          <div className={`h-4 w-full ${baseClass}`} />
          <div className={`h-4 w-5/6 ${baseClass}`} />
        </div>
        <div className={`h-10 w-28 mt-2 ${baseClass}`} />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`flex flex-col gap-4 w-full ${className}`}>
        <div className="flex gap-4 border-b border-slate-800 pb-3">
          <div className={`h-5 w-1/4 ${baseClass}`} />
          <div className={`h-5 w-1/4 ${baseClass}`} />
          <div className={`h-5 w-1/4 ${baseClass}`} />
          <div className={`h-5 w-1/4 ${baseClass}`} />
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className={`h-4 w-1/4 ${baseClass}`} />
            <div className={`h-4 w-1/4 ${baseClass}`} />
            <div className={`h-4 w-1/4 ${baseClass}`} />
            <div className={`h-4 w-1/4 ${baseClass}`} />
          </div>
        ))}
      </div>
    );
  }

  // Default: text rows
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {[...Array(rows)].map((_, i) => {
        const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-5/6', 'w-3/4'];
        const width = widths[i % widths.length];
        return <div key={i} className={`h-4 ${width} ${baseClass}`} />;
      })}
    </div>
  );
}
