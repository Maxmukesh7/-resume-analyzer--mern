import Card from './Card';

export default function StatCard({
  title,
  value,
  icon,
  delta,
  deltaType = 'positive',
  description,
  className = ''
}) {
  const isPositive = deltaType === 'positive';
  const deltaColor = isPositive ? 'text-emerald-400' : 'text-rose-400';

  return (
    <Card hoverEffect className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        <div className="p-3.5 bg-slate-800/80 border border-slate-700/50 text-blue-400 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.25)]">
          {icon}
        </div>
      </div>

      {(delta || description) && (
        <div className="flex items-center gap-2 mt-4 text-xs">
          {delta && (
            <span className={`font-bold flex items-center ${deltaColor}`}>
              {isPositive ? '↑' : '↓'} {delta}
            </span>
          )}
          {description && (
            <span className="text-slate-500 font-medium">{description}</span>
          )}
        </div>
      )}
    </Card>
  );
}
