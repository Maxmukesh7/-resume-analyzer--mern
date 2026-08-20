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
  const [deletingId, setDeletingId] = useState(null);
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

  const fetchDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
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
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const handleAnalyzeResume = (id) => {
    navigate(`/dashboard/analysis/${id}`);
  };

  const handleDeleteResume = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    const previousResumes = recentResumes;
    const previousStats = stats;

    // Optimistic UI updates
    setRecentResumes((prev) => prev.filter((r) => r.id !== id));
    setStats((prev) => ({
      ...prev,
      totalUploads: Math.max(0, prev.totalUploads - 1)
    }));
    setDeletingId(id);

    try {
      await deleteResume(id);
      showToast('Resume deleted successfully', 'success');
      // Background sync without taking down the UI
      fetchDashboardData(false);
    } catch (err) {
      // Revert optimistic updates on failure
      setRecentResumes(previousResumes);
      setStats(previousStats);
      showToast(err.response?.data?.message || 'Failed to delete resume', 'error');
    } finally {
      setDeletingId(null);
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
          <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-wide">Dashboard Overview</h1>
          <p className="text-[#A7ADB7] text-xs mt-1.5 font-semibold">
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
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-[#A7ADB7]">
          <FaSpinner className="animate-spin text-[#F5B83D]" size={28} />
          <span className="text-xs font-semibold">Loading live dashboard metrics...</span>
        </div>
      ) : (
        <>
          {/* Grid of Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Uploads"
              value={stats.totalUploads}
              icon={<FaFileAlt size={20} />}
              delta={stats.totalUploads > 0 ? `+${stats.totalUploads}` : '0'}
              deltaType="positive"
              description="total parsed documents"
            />
            <StatCard
              title="Highest ATS Score"
              value={`${stats.highestAtsScore}%`}
              icon={<FaAward size={20} className="text-[#F5B83D]" />}
              delta="Target: 85%+"
              deltaType="positive"
              description="peak benchmark"
            />
            <StatCard
              title="Target Matches"
              value={stats.applicationsSent}
              icon={<FaPaperPlane size={20} className="text-[#FFD166]" />}
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
              <h3 className="text-lg font-bold text-[#F5F5F5] tracking-wide flex items-center gap-2">
                <FaListAlt size={16} className="text-[#F5B83D]" />
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
                    isDeleting={deletingId === resume.id}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center space-y-4 bg-[#121519] border-[#292D33]">
                <FaFileAlt className="text-[#6F7682] mx-auto" size={32} />
                <p className="text-sm font-semibold text-[#F5F5F5]">No resumes uploaded yet.</p>
                <p className="text-xs text-[#A7ADB7] max-w-sm mx-auto">
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
