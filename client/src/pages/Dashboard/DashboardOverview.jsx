import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaAward, FaListAlt, FaPaperPlane, FaFileAlt } from 'react-icons/fa';
import StatCard from '../../components/Common/StatCard';
import ChartCard from '../../components/Common/ChartCard';
import ResumeCard from '../../components/Common/ResumeCard';
import Button from '../../components/Common/Button';
import { mockStats, mockHistory } from '../../utils/mockData';

export default function DashboardOverview() {
  const navigate = useNavigate();

  // Get the most recent 3 resumes for the "Recent Activity" list
  const recentResumes = mockHistory.slice(0, 3);

  const handleAnalyzeResume = (id) => {
    navigate(`/dashboard/report?id=${id}`);
  };

  const handleCreateUpload = () => {
    navigate('/dashboard/upload');
  };

  return (
    <div className="space-y-8 relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">Dashboard Overview</h1>
          <p className="text-slate-450 text-xs mt-1.5 font-semibold">
            Track your profile's parsing optimization efficiency and score improvements.
          </p>
        </div>
        <Button
          onClick={handleCreateUpload}
          icon={<FaCloudUploadAlt size={16} />}
          variant="primary"
        >
          Upload New Resume
        </Button>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Uploads"
          value={mockStats.totalUploads}
          icon={<FaFileAlt size={20} />}
          delta="+2"
          deltaType="positive"
          description="scanned this week"
        />
        <StatCard
          title="Average ATS Score"
          value={`${mockStats.averageAtsScore}%`}
          icon={<FaAward size={20} className="text-amber-400" />}
          delta="+4.5%"
          deltaType="positive"
          description="vs last month"
        />
        <StatCard
          title="Highest ATS Score"
          value={`${mockStats.highestAtsScore}%`}
          icon={<FaAward size={20} className="text-emerald-400" />}
          delta="+8%"
          deltaType="positive"
          description="optimized score"
        />
        <StatCard
          title="Applications Sent"
          value={mockStats.applicationsSent}
          icon={<FaPaperPlane size={20} />}
          delta="+1"
          deltaType="positive"
          description="tracked status"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title="ATS Score History"
          subtitle="Overall parsing optimization trend over time"
          type="line"
          data={mockStats.scoreHistory}
          className="lg:col-span-2"
        />
        <ChartCard
          title="Category Breakdowns"
          subtitle="Performance metrics per resume parameter"
          type="bar-list"
          data={mockStats.categoryScores}
        />
      </div>

      {/* Recent Resumes List */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <FaListAlt size={16} className="text-blue-400" />
            <span>Recent Activities</span>
          </h3>
          <Button
            onClick={() => navigate('/dashboard/history')}
            variant="outline"
            size="sm"
          >
            View All History
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentResumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onAnalyze={handleAnalyzeResume}
              onDelete={(id) => console.log('Delete resume', id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
