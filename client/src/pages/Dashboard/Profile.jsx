import { useState, useEffect, useRef } from 'react';
import { FaUser, FaBriefcase, FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { useAuth } from '../../context/AuthContext';
import { getResumes } from '../../services/resumeService';
import { getFileUrl } from '../../services/api';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';

export default function Profile() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    skills: user?.skills || ['JavaScript', 'React', 'Node.js'],
    experience: user?.experience || '',
    avatar: user?.avatar || DEFAULT_AVATAR
  });
  const [resumesCount, setResumesCount] = useState(0);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        skills: Array.isArray(user.skills) && user.skills.length > 0 ? user.skills : prev.skills,
        experience: user.experience || '',
        avatar: user.avatar || DEFAULT_AVATAR
      }));
    }
    // Fetch user resumes count
    getResumes()
      .then((res) => {
        const list = res.data || res || [];
        setResumesCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
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
      college: profile.college,
      skills: profile.skills,
      experience: profile.experience,
      avatar: profile.avatar
    });
    setLoading(false);
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow re-uploading same file if desired
    e.target.value = '';

    // Validate file type (JPG, JPEG, PNG, WEBP)
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;

    if (!validMimes.includes(file.type) && !validExtensions.test(file.name)) {
      showToast('Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.', 'error');
      return;
    }

    // Validate size (5MB maximum)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('Image file size exceeds the 5MB limit.', 'error');
      return;
    }

    try {
      setUploadingAvatar(true);
      const result = await uploadAvatar(file);
      if (result.success && result.user) {
        setProfile((prev) => ({
          ...prev,
          avatar: result.user.avatar || DEFAULT_AVATAR
        }));
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
    }
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
              src={getFileUrl(profile.avatar) || DEFAULT_AVATAR}
              alt="Profile avatar"
              className={`w-32 h-32 rounded-2xl object-cover border-2 border-slate-800 shadow-md transition-all ${
                uploadingAvatar ? 'opacity-50 blur-[1px]' : 'group-hover:opacity-90'
              }`}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
            {uploadingAvatar && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl">
                <FaSpinner className="animate-spin text-blue-400" size={24} />
                <span className="text-[10px] text-slate-200 mt-1 font-semibold">Uploading...</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleAvatarFileChange}
              className="hidden"
              aria-label="Upload profile picture"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-2 right-2 p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 disabled:bg-blue-800 transition-colors shadow-lg cursor-pointer"
              title="Upload new photo (JPG, PNG, WEBP max 5MB)"
            >
              <FaCamera size={14} />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-2.5">
            JPG, PNG, or WEBP (Max 5MB)
          </p>
          <h3 className="text-base font-bold text-white mt-4">{profile.name || 'User Profile'}</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">{profile.email}</p>
          <div className="w-full border-t border-slate-850 mt-6 pt-5 flex flex-col gap-2 text-left">
            <span className="text-[10px] text-slate-500 uppercase font-extrabold">Account Summary</span>
            <div className="flex justify-between text-xs font-semibold py-1">
              <span className="text-slate-400">Account Role:</span>
              <span className="text-blue-400 capitalize">{user?.role || 'User'}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold py-1">
              <span className="text-slate-400">Resumes Uploaded:</span>
              <span className="text-blue-400">{resumesCount} Documents</span>
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
                disabled
              />
              <Input
                id="prof-phone"
                label="Phone Number"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
              <Input
                id="prof-college"
                label="College / University"
                value={profile.college}
                onChange={(e) => handleInputChange('college', e.target.value)}
                placeholder="e.g. Stanford University"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Work Experience / Professional Summary
              </label>
              <textarea
                value={profile.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="Brief summary of your professional background and core expertise..."
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
