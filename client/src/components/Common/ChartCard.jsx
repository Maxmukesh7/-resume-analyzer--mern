import Card from './Card';
import { motion } from 'framer-motion';

export default function ChartCard({
  title,
  subtitle,
  type = 'line', // 'line' | 'bar-list'
  data = [],
  className = ''
}) {
  return (
    <Card className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-[#A7ADB7] uppercase tracking-wider">
          {title}
        </span>
        {subtitle && <p className="text-[#6F7682] text-xs mt-1">{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-[200px] flex items-center justify-center">
        {type === 'line' && data.length > 0 && <AreaChart data={data} />}
        {type === 'bar-list' && data.length > 0 && <BarList data={data} />}
        {data.length === 0 && (
          <span className="text-[#6F7682] text-sm">No data available</span>
        )}
      </div>
    </Card>
  );
}

// Custom SVG Area Chart
function AreaChart({ data }) {
  const width = 500;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;

  const minVal = 0;
  const maxVal = 100;

  const pointsCount = data.length;
  
  // Map points to SVG coordinates
  const coords = data.map((item, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / (pointsCount - 1);
    const y = height - paddingY - ((item.score - minVal) * (height - paddingY * 2)) / (maxVal - minVal);
    return { x, y, label: item.name, val: item.score };
  });

  // Build the SVG path string
  const linePath = coords.reduce((acc, coord, idx) => {
    return idx === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`;
  }, '');

  // Build the filled area path string (extends down to bottom border)
  const fillPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5B83D" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD166" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F5B83D" />
              <stop offset="100%" stopColor="#FFD166" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = height - paddingY - (val * (height - paddingY * 2)) / 100;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(41, 45, 51, 0.7)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="#A7ADB7"
                  fontSize="10"
                  textAnchor="end"
                  className="font-medium"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Filled Area */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            d={fillPath}
            fill="url(#chartGlow)"
          />

          {/* Glowing Line */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            d={linePath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {coords.map((coord, idx) => (
            <g key={idx} className="group cursor-pointer">
              <motion.circle
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: 'spring' }}
                cx={coord.x}
                cy={coord.y}
                r="5"
                fill="#ffffff"
                stroke="#F5B83D"
                strokeWidth="3"
                className="transition-all duration-200 group-hover:r-7 group-hover:stroke-[#FFD166]"
              />
              {/* Tooltip on Hover */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={coord.x - 22}
                  y={coord.y - 32}
                  width="44"
                  height="22"
                  rx="6"
                  fill="#121519"
                  stroke="#292D33"
                  strokeWidth="1"
                />
                <text
                  x={coord.x}
                  y={coord.y - 17}
                  fill="#F5F5F5"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {coord.val}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>

      {/* X Labels */}
      <div className="flex justify-between px-9 mt-2 border-t border-[#292D33] pt-2">
        {coords.map((coord, idx) => (
          <span key={idx} className="text-[#A7ADB7] text-xs font-semibold uppercase tracking-wider">
            {coord.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Category Scores Bar List
function BarList({ data }) {
  return (
    <div className="w-full flex flex-col gap-4">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-[#F5F5F5]">{item.name}</span>
            <span className="text-[#F5B83D] font-semibold">{item.score}%</span>
          </div>
          <div className="h-2 w-full bg-[#0D0F12] rounded-full overflow-hidden border border-[#292D33]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.score}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="h-full bg-gradient-to-r from-[#F5B83D] to-[#FFD166] rounded-full shadow-[0_0_10px_rgba(245,184,61,0.3)]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
