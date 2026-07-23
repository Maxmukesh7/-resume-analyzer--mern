import { useState, useEffect } from 'react';
import { FaUser, FaBriefcase, FaTimes, FaCamera } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { mockUser } from '../../utils/mockData';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: mockUser.college,
    skills: mockUser.skills,
    experience: mockUser.experience,
    avatar: user?.avatar || mockUser.avatar
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || mockUser.avatar
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const skill = newSkill.trim();
    if (!skill) return;

    if (profile.skills.includes(skill)) {
      showToast('Skill already exists!', 'warning');
      return;
    }

    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, skill]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    await updateProfile({
      fullName: profile.name,
      phone: profile.phone,
      avatar: profile.avatar
    });
    setLoading(false);
  };

  const handleAvatarChange = () => {
    showToast('Profile image uploads are disabled in demo mode.', 'info');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-wide">My Profile</h1>
        <p className="text-slate-455 text-xs mt-1.5 font-semibold">
          Manage your personal credentials, contact endpoints, and targeted job skills.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Avatar Panel */}
        <Card className="flex flex-col items-center p-8 text-center h-fit">
          <div className="relative group">
            <img
              src={profile.avatar}
              alt="Profile avatar"
              className="w-32 h-32 rounded-2xl object-cover border-2 border-slate-800 shadow-md group-hover:opacity-85 transition-opacity"
            />
            <button
              type="button"
              onClick={handleAvatarChange}
              className="absolute bottom-2 right-2 p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-colors shadow-lg"
              title="Change Photo"
            >
              <FaCamera size={14} />
            </button>
          </div>
          <h3 className="text-base font-bold text-white mt-5">{profile.name}</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">{profile.email}</p>
          <div className="w-full border-t border-slate-850 mt-6 pt-5 flex flex-col gap-2 text-left">
            <span className="text-[10px] text-slate-500 uppercase font-extrabold">Statistics Summary</span>
            <div className="flex justify-between text-xs font-semibold py-1">
              <span className="text-slate-400">Target Role Fit:</span>
              <span className="text-blue-400">Fullstack Engineer</span>
            </div>
            <div className="flex justify-between text-xs font-semibold py-1">
              <span className="text-slate-400">Resumes Analyzed:</span>
              <span className="text-blue-400">14 Files</span>
            </div>
          </div>
        </Card>

        {/* Right Side: Credentials & Skills Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="p-8 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-900 pb-3">
              <FaUser size={12} className="text-blue-400" />
              <span>Personal Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                id="prof-name"
                label="Full Name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
              <Input
                id="prof-email"
                label="Email Address"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
              <Input
                id="prof-phone"
                label="Phone Number"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <Input
                id="prof-college"
                label="College / University"
                value={profile.college}
                onChange={(e) => handleInputChange('college', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Work Experience Summary
              </label>
              <textarea
                value={profile.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm h-24"
              />
            </div>
          </Card>

          {/* Skill Tag list Manager */}
          <Card className="p-8 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-900 pb-3">
              <FaBriefcase size={12} className="text-purple-400" />
              <span>Targeted Skills Portfolio</span>
            </h3>

            {/* Input to add tag */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Add a new skill (e.g. Docker, TypeScript)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-all text-xs"
              />
              <Button onClick={handleAddSkill} type="button" size="sm">
                Add Tag
              </Button>
            </div>

            {/* Skill tags container */}
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-900/50 text-slate-300"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
            </div>
          </Card>

          {/* Submit Actions */}
          <div className="flex justify-end gap-4">
            <Button type="submit" loading={loading} className="px-10">
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
