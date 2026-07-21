import { useState } from 'react';
import Navbar from '../../components/Landing/Navbar';
import Footer from '../../components/Landing/Footer';
import Card from '../../components/Common/Card';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import { useToast } from '../../components/Common/Toast';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export default function Contact() {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    setLoading(true);

    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      showToast('Message sent! Our support team will get in touch.', 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans antialiased selection:bg-blue-600/35 selection:text-white flex flex-col justify-between">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-28 pb-16 px-6 relative overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-12">
          {/* Title Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Contact Us
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Get In Touch With <br />
              <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Our Support Team
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Have questions regarding ATS scanning metrics, API integrations, or business pricing? Fill in the details below.
            </p>
          </div>

          {/* Form & details panel layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-6">
            {/* Left Column: Form & Map */}
            <Card className="p-8">
              <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider border-b border-slate-900 pb-3">
                Send a Message
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="contact-name"
                    label="Full Name"
                    placeholder="e.g. Mukesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    id="contact-email"
                    label="Email Address"
                    type="email"
                    placeholder="e.g. mukesh.kumar@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Input
                  id="contact-subject"
                  label="Subject"
                  placeholder="How can we assist you?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Message Description
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Provide details about your query..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                  />
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Send Message
                </Button>
              </form>
            </Card>

            {/* Right Column: Support details & Map Placeholder */}
            <div className="space-y-6">
              {/* Details card */}
              <Card className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl shrink-0">
                    <FaEnvelope size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Email Support</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">support@resumeanalyzer.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl shrink-0">
                    <FaPhone size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Phone Support</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                    <FaMapMarkerAlt size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Our Office</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">
                      IIT Delhi Research Park,<br />Hauz Khas, New Delhi 110016
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-600/10 border border-amber-500/20 text-amber-450 rounded-xl shrink-0">
                    <FaClock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Working Hours</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">
                      Mon - Fri: 9:00 AM - 6:00 PM<br />Sat - Sun: Closed
                    </p>
                  </div>
                </div>
              </Card>

              {/* Map Placeholder Card */}
              <Card className="p-0 overflow-hidden border border-slate-800/80 h-[218px] relative flex items-center justify-center">
                {/* Decorative map graphics grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                
                {/* Visual Location Target Marker */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="relative">
                    {/* Ring Waves */}
                    <div className="absolute -inset-2 w-10 h-10 bg-blue-500/30 rounded-full animate-ping" />
                    <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg relative z-10">
                      <FaMapMarkerAlt size={10} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    IIT Delhi, Hauz Khas
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
