import Card from './Card';
import Badge from './Badge';
import { FaFileAlt, FaCalendarAlt, FaTrash, FaChartLine, FaSpinner } from 'react-icons/fa';

export default function ResumeCard({
  resume,
  onAnalyze,
  onDelete,
  isDeleting = false
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
    <Card hoverEffect className="flex flex-col gap-4 justify-between h-full bg-[#121519] border-[#292D33]">
      <div className="flex items-start justify-between gap-3">
        <div className="p-3 bg-[#F5B83D]/10 border border-[#F5B83D]/30 text-[#F5B83D] rounded-xl">
          <FaFileAlt size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#F5F5F5] truncate" title={resume.name}>
            {resume.name}
          </h4>
          <span className="flex items-center gap-1.5 text-xs text-[#A7ADB7] mt-1">
            <FaCalendarAlt size={11} />
            {resume.uploadDate}
          </span>
        </div>
        <Badge variant={getScoreVariant(resume.score)}>
          {resume.score}%
        </Badge>
      </div>

      <div className="flex items-center justify-between border-t border-[#292D33] pt-3 mt-1">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6F7682] uppercase font-semibold">Status</span>
          <Badge variant={getStatusVariant(resume.status)} className="mt-1">
            {resume.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {onAnalyze && (
            <button
              onClick={() => onAnalyze(resume.id)}
              className="p-2 text-xs font-semibold rounded-lg text-[#F5B83D] hover:text-[#FFD166] hover:bg-[#F5B83D]/10 border border-[#F5B83D]/30 transition-all flex items-center gap-1 cursor-pointer"
              title="View ATS Report"
            >
              <FaChartLine size={13} />
              <span>Report</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(resume.id)}
              disabled={isDeleting}
              className={`p-2 text-xs font-semibold rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/10 border border-rose-500/25 transition-all cursor-pointer ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Delete Resume"
            >
              {isDeleting ? <FaSpinner className="animate-spin" size={13} /> : <FaTrash size={13} />}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
