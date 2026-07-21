// Mock Data for AI Resume Analyzer

export const mockUser = {
  name: "Mukesh Kumar",
  email: "mukesh.kumar@example.com",
  phone: "+91 98765 43210",
  college: "Indian Institute of Technology, Delhi",
  skills: ["React.js", "Node.js", "Express.js", "MongoDB", "Tailwind CSS", "JavaScript", "Python", "Git", "REST APIs"],
  experience: "2+ Years of Software Development Experience",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
};

export const mockStats = {
  totalUploads: 14,
  averageAtsScore: 78,
  highestAtsScore: 92,
  applicationsSent: 8,
  scoreHistory: [
    { name: "Jan", score: 65 },
    { name: "Feb", score: 70 },
    { name: "Mar", score: 72 },
    { name: "Apr", score: 78 },
    { name: "May", score: 85 },
    { name: "Jun", score: 92 }
  ],
  categoryScores: [
    { name: "Keywords", score: 82 },
    { name: "Formatting", score: 90 },
    { name: "Experience", score: 75 },
    { name: "Skills", score: 85 },
    { name: "Education", score: 60 }
  ]
};

export const mockNotifications = [
  { id: 1, text: "Resume 'Mukesh_Resume_Fullstack.pdf' scanned successfully.", time: "5 mins ago", read: false },
  { id: 2, text: "Your ATS score improved by 12 points after updating keywords.", time: "2 hours ago", read: false },
  { id: 3, text: "New recruiter suggestion added for your backend profile.", time: "1 day ago", read: true },
  { id: 4, text: "Welcome to AI Resume Analyzer! Start by uploading your resume.", time: "3 days ago", read: true }
];

export const mockHistory = [
  {
    id: "res-001",
    name: "Mukesh_SDE_Resume_v1.pdf",
    uploadDate: "2026-07-20",
    score: 92,
    status: "Optimized",
    fileSize: "1.2 MB"
  },
  {
    id: "res-002",
    name: "Mukesh_Frontend_Resume.pdf",
    uploadDate: "2026-07-18",
    score: 84,
    status: "Good",
    fileSize: "980 KB"
  },
  {
    id: "res-003",
    name: "Mukesh_Resume_Draft.docx",
    uploadDate: "2026-07-10",
    score: 58,
    status: "Needs Action",
    fileSize: "450 KB"
  },
  {
    id: "res-004",
    name: "General_Resume_Backup.pdf",
    uploadDate: "2026-06-15",
    score: 68,
    status: "Needs Action",
    fileSize: "1.1 MB"
  }
];

export const mockAtsReports = {
  "res-001": {
    id: "res-001",
    name: "Mukesh_SDE_Resume_v1.pdf",
    overallScore: 92,
    uploadDate: "2026-07-20",
    metrics: {
      keywordMatch: 94,
      skillsMatch: 90,
      formattingScore: 95,
      experienceScore: 88,
      educationScore: 92
    },
    strengths: [
      "Excellent density of tech stack keywords (React, Node, Express, MongoDB).",
      "Perfect use of reverse chronological formatting.",
      "Clear, quantified bullet points using the Google X-Y-Z formula.",
      "No parsing errors found; fully machine-readable layout."
    ],
    weaknesses: [
      "Slightly wordy summaries in the experience section.",
      "Missing links to live project deployments (only GitHub links present)."
    ],
    missingKeywords: [
      "GraphQL",
      "Docker",
      "CI/CD Pipelines",
      "Kubernetes"
    ],
    recruiterSuggestions: [
      "Include a direct link to your portfolio site or live applications next to GitHub links.",
      "Condense the project descriptions to maximum of 3 lines each.",
      "Use stronger action verbs like 'Architected', 'Spearheaded' instead of 'Worked on'."
    ],
    aiSuggestions: [
      "To reach 98%+ score: Add a section on Cloud platforms (AWS/GCP) if you have experience.",
      "Ensure all headings match standard categories (e.g. 'Work Experience' instead of 'Professional History')."
    ]
  },
  "res-002": {
    id: "res-002",
    name: "Mukesh_Frontend_Resume.pdf",
    overallScore: 84,
    uploadDate: "2026-07-18",
    metrics: {
      keywordMatch: 85,
      skillsMatch: 88,
      formattingScore: 80,
      experienceScore: 82,
      educationScore: 90
    },
    strengths: [
      "Strong frontend framework highlights (React, Tailwind CSS).",
      "Clean margins and spacing.",
      "Education background is well-formatted."
    ],
    weaknesses: [
      "Multi-column layout might cause issues with older ATS parsers.",
      "A few tables were used for layouts, which is a critical parsing risk."
    ],
    missingKeywords: [
      "Next.js",
      "TypeScript",
      "Redux Toolkit",
      "Webpack"
    ],
    recruiterSuggestions: [
      "Refactor multi-column structure into a single-column layout.",
      "Remove all tables and instead use simple bullet points for listing skills."
    ],
    aiSuggestions: [
      "Re-organize skills section to group by Frontend, Backend, and Tools.",
      "Include metrics (e.g., 'improved performance by 25%') to quantify achievements."
    ]
  },
  "res-003": {
    id: "res-003",
    name: "Mukesh_Resume_Draft.docx",
    overallScore: 58,
    uploadDate: "2026-07-10",
    metrics: {
      keywordMatch: 52,
      skillsMatch: 60,
      formattingScore: 50,
      experienceScore: 55,
      educationScore: 70
    },
    strengths: [
      "Contact information is complete and correct.",
      "Standard document format (.docx) is readable."
    ],
    weaknesses: [
      "Heavy headers, footers, and text box styles which confuse ATS parsers.",
      "Low volume of matching industry keywords.",
      "Vague descriptions lacking action verbs and numeric outcomes."
    ],
    missingKeywords: [
      "REST APIs",
      "Git",
      "Agile Methodology",
      "JavaScript",
      "Node.js",
      "Database Design"
    ],
    recruiterSuggestions: [
      "Immediately eliminate all text boxes, shapes, icons, and charts.",
      "Add key technologies related to the job description to the skills and projects section."
    ],
    aiSuggestions: [
      "Rewrite resume with standard font family (Arial/Calibri/Times New Roman) and standard sizing.",
      "Inject at least 5 missing keywords to boost keyword matching rating by 20+ points."
    ]
  },
  "res-004": {
    id: "res-004",
    name: "General_Resume_Backup.pdf",
    overallScore: 68,
    uploadDate: "2026-06-15",
    metrics: {
      keywordMatch: 66,
      skillsMatch: 70,
      formattingScore: 65,
      experienceScore: 60,
      educationScore: 80
    },
    strengths: [
      "Clear chronological history of roles.",
      "Includes links to LinkedIn."
    ],
    weaknesses: [
      "Use of passive language throughout the document.",
      "Overly generalized bullet points."
    ],
    missingKeywords: [
      "Unit Testing",
      "Jest",
      "SQL",
      "System Design"
    ],
    recruiterSuggestions: [
      "Tailor this resume to SDE specifically rather than keeping it too general.",
      "Improve work summaries to mention direct project responsibilities."
    ],
    aiSuggestions: [
      "Use strong action verbs to lead each description.",
      "Ensure sections are clearly separated with standard borders."
    ]
  }
};
