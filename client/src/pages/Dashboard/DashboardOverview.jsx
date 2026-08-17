import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCloudUploadAlt, FaAward, FaListAlt, FaPaperPlane, FaFileAlt, FaSpinner } from 'react-icons/fa';
import StatCard from '../../components/Common/StatCard';
import ChartCard from '../../components/Common/ChartCard';
import ResumeCard from '../../components/Common/ResumeCard';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import { getResumes, deleteResume } from '../../services/resumeService';
import api from '../../services/api';
import { useToast } from '../../components/Common/Toast';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUploads: 0,
    averageAtsScore: 0,
    highestAtsScore: 0,
    applicationsSent: 0,
    scoreHistory: [],
    categoryScores: [
      { name: 'Keywords', score: 0 },
      { name: 'Formatting', score: 0 },
      { name: 'Experience', score: 0 },
      { name: 'Skills', score: 0 },
      { name: 'Education', score: 0 }
    ]
  });
  const [recentResumes, setRecentResumes] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, resumesRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
        getResumes().catch(() => ({ data: [] }))
      ]);

      if (statsRes.data?.data) {
        setStats((prev) => ({ ...prev, ...statsRes.data.data }));
      }

      const resumesList = resumesRes.data || resumesRes || [];
      const formatted = (Array.isArray(resumesList) ? resumesList : []).slice(0, 3).map((r) => ({
        id: r._id || r.id,
        name: r.originalName || r.fileName,
        uploadDate: new Date(r.uploadDate || r.createdAt || Date.now()).toLocaleDateString(),
        score: r.atsScore || (r.parseStatus === 'parsed' ? 85 : 0),
        status: r.parseStatus === 'parsed' ? 'Optimized' : r.parseStatus === 'failed' ? 'Needs Action' : 'Good',
        fileSize: r.fileSize
      }));
      setRecentResumes(formatted);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAnalyzeResume = (id) => {
    navigate(`/dashboard/analysis/${id}`);
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await deleteResume(id);
      showToast('Resume deleted successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete resume', 'error');
    }
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

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-slate-400">
          <FaSpinner className="animate-spin text-blue-500" size={28} />
          <span className="text-xs font-semibold">Loading live dashboard metrics...</span>
        </div>
      ) : (
        <>
          {/* Grid of Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Uploads"
              value={stats.totalUploads}
              icon={<FaFileAlt size={20} />}
              delta={stats.totalUploads > 0 ? `+${stats.totalUploads}` : '0'}
              deltaType="positive"
              description="total parsed documents"
            />
            <StatCard
              title="Average ATS Score"
              value={`${stats.averageAtsScore}%`}
              icon={<FaAward size={20} className="text-amber-400" />}
              delta={stats.averageAtsScore >= 70 ? 'Optimal' : 'Needs Action'}
              deltaType={stats.averageAtsScore >= 70 ? 'positive' : 'negative'}
              description="overall compliance"
            />
            <StatCard
              title="Highest ATS Score"
              value={`${stats.highestAtsScore}%`}
              icon={<FaAward size={20} className="text-emerald-400" />}
              delta="Target: 85%+"
              deltaType="positive"
              description="peak benchmark"
            />
            <StatCard
              title="Target Matches"
              value={stats.applicationsSent}
              icon={<FaPaperPlane size={20} />}
              delta="Job Match"
              deltaType="positive"
              description="scanned positions"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard
              title="ATS Score History"
              subtitle="Overall parsing optimization trend over time"
              type="line"
              data={stats.scoreHistory.length > 0 ? stats.scoreHistory : [{ name: 'Current', score: stats.averageAtsScore }]}
              className="lg:col-span-2"
            />
            <ChartCard
              title="Category Breakdowns"
              subtitle="Performance metrics per resume parameter"
              type="bar-list"
              data={stats.categoryScores}
            />
          </div>

          {/* Recent Resumes List */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <FaListAlt size={16} className="text-blue-400" />
                <span>Recent Resumes</span>
              </h3>
              <Button
                onClick={() => navigate('/dashboard/history')}
                variant="outline"
                size="sm"
              >
                View All History
              </Button>
            </div>

            {recentResumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentResumes.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    onAnalyze={handleAnalyzeResume}
                    onDelete={handleDeleteResume}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center space-y-4">
                <FaFileAlt className="text-slate-600 mx-auto" size={32} />
                <p className="text-sm font-semibold text-slate-300">No resumes uploaded yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload your resume in PDF or DOCX format to receive immediate ATS scoring, keyword match analysis, and AI suggestions.
                </p>
                <Button onClick={handleCreateUpload} variant="primary" size="sm">
                  Upload Your First Resume
                </Button>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
