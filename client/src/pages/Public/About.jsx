import { useEffect } from 'react';
import Navbar from '../../components/Landing/Navbar';
import Card from '../../components/Common/Card';
import { FaEye, FaRocket, FaShieldAlt, FaChartLine, FaRobot, FaUsers } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

export default function About() {
  const { setDarkMode } = useTheme();

  useEffect(() => {
    setDarkMode(true);
  }, []);
  const benefits = [
    {
      icon: <FaRobot size={24} className="text-[#F5B83D]" />,
      title: "AI-Powered Diagnostics",
      desc: "Our advanced neural parsing models read resume formats exactly like top-tier Applicant Tracking Systems do."
    },
    {
      icon: <FaChartLine size={24} className="text-[#FFD166]" />,
      title: "Dynamic Keyword Insights",
      desc: "Receive immediate semantic comparisons pointing out critical industry terms and skill tags missing from your files."
    },
    {
      icon: <FaShieldAlt size={24} className="text-[#F5B83D]" />,
      title: "100% Privacy Secure",
      desc: "Your credentials and resume details are never cached publicly. You maintain total visibility settings control."
    },
    {
      icon: <FaUsers size={24} className="text-[#FFD166]" />,
      title: "Recruiter Grade Reviews",
      desc: "Access actionable layout optimization tweaks matching direct recruiter screening preferences."
    }
  ];

  return (
    <div className="bg-[#08090B] min-h-screen text-[#F5F5F5] font-sans antialiased selection:bg-[#F5B83D]/30 selection:text-[#F5F5F5] flex flex-col justify-between">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-28 pb-16 px-6 relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-[#F5B83D]/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-[#FFD166]/[0.02] rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-16">
          {/* Main Title Section */}
          <div className="text-center space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-[#F5B83D] to-[#FFD166] bg-clip-text text-transparent">
              Who We Are
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-[#F5F5F5] tracking-tight leading-tight">
              Empowering Job Seekers with <br />
              <span className="bg-gradient-to-r from-[#F5B83D] via-[#FFD166] to-[#F5B83D] bg-clip-text text-transparent">
                ATS Diagnostics
              </span>
            </h1>
            <p className="text-[#A7ADB7] text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              We build intelligent SaaS products designed to bridge the structural gap between talented professionals and corporate parsing systems.
            </p>
          </div>

          {/* Mission & Vision Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
            <Card className="p-8 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-3.5 text-[#F5B83D]">
                <FaRocket size={22} className="drop-shadow-[0_0_8px_rgba(245,184,61,0.3)]" />
                <h3 className="text-lg font-bold text-[#F5F5F5] tracking-wide">Our Mission</h3>
              </div>
              <p className="text-xs md:text-sm text-[#A7ADB7] leading-relaxed font-semibold">
                To democratize corporate recruitment intelligence. We believe job candidates shouldn't be filtered out by automated resume screening algorithms simply because of formatting anomalies or missing keywords. Our goal is to make professional resumes fully machine-readable.
              </p>
            </Card>

            <Card className="p-8 space-y-4 bg-[#121519] border-[#292D33]">
              <div className="flex items-center gap-3.5 text-[#FFD166]">
                <FaEye size={22} className="drop-shadow-[0_0_8px_rgba(255,209,102,0.3)]" />
                <h3 className="text-lg font-bold text-[#F5F5F5] tracking-wide">Our Vision</h3>
              </div>
              <p className="text-xs md:text-sm text-[#A7ADB7] leading-relaxed font-semibold">
                To create a seamless, transparent hiring ecosystem where credentials and project achievements speak louder than parsing formats. We envision a future where AI acts as a personal career counselor for every engineer, designer, and manager.
              </p>
            </Card>
          </div>

          {/* Product Benefits Section */}
          <div className="space-y-8 pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
                Why Professionals Choose Us
              </h2>
              <p className="text-[#A7ADB7] text-xs font-semibold">
                State-of-the-art diagnostic features engineered for maximum placement success
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((ben, idx) => (
                <Card hoverEffect key={idx} className="p-6 space-y-4 flex flex-col justify-between bg-[#121519] border-[#292D33]">
                  <div className="p-3 bg-[#171A1F] border border-[#292D33] rounded-xl w-fit">
                    {ben.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#F5F5F5] mb-2">{ben.title}</h4>
                    <p className="text-[11px] text-[#A7ADB7] leading-relaxed font-medium">{ben.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
