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
          <span className="text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider">
            {title}
          </span>
          <h3 className="text-3xl font-extrabold text-[#F5F5F5] mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        <div className="p-3.5 bg-[#171A1F] border border-[#292D33] text-[#F5B83D] rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.35)]">
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
            <span className="text-[#6F7682] font-medium">{description}</span>
          )}
        </div>
      )}
    </Card>
  );
}
