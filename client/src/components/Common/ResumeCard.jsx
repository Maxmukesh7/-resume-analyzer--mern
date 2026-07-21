import Card from './Card';
import Badge from './Badge';
import { FaFileAlt, FaCalendarAlt, FaTrash, FaChartLine } from 'react-icons/fa';

export default function ResumeCard({
  resume,
  onAnalyze,
  onDelete
}) {
  const getScoreVariant = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'info';
    return 'warning';
  };

  const getStatusVariant = (status) => {
    if (status === 'Optimized') return 'success';
    if (status === 'Good') return 'info';
    return 'warning';
  };

  return (
    <Card hoverEffect className="flex flex-col gap-4 justify-between h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
          <FaFileAlt size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate" title={resume.name}>
            {resume.name}
          </h4>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <FaCalendarAlt size={11} />
            {resume.uploadDate}
          </span>
        </div>
        <Badge variant={getScoreVariant(resume.score)}>
          {resume.score}%
        </Badge>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Status</span>
          <Badge variant={getStatusVariant(resume.status)} className="mt-1">
            {resume.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {onAnalyze && (
            <button
              onClick={() => onAnalyze(resume.id)}
              className="p-2 text-xs font-semibold rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/10 border border-blue-500/20 transition-all flex items-center gap-1"
              title="View ATS Report"
            >
              <FaChartLine size={13} />
              <span>Report</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(resume.id)}
              className="p-2 text-xs font-semibold rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/10 border border-rose-500/20 transition-all"
              title="Delete Resume"
            >
              <FaTrash size={13} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
