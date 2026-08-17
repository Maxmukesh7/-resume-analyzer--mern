# Automated AI Resume Analyzer & Candidate Ranking Platform

An industry-grade, full-stack **MERN** (MongoDB, Express, React, Node.js) web application designed for job seekers and recruiters. It features high-accuracy multi-format resume parsing (PDF, DOC, DOCX), deterministic **ATS Scoring (0–100)**, **Google Gemini AI** analysis & career insights, interactive **Job Description Matching**, **AI Resume Content Improvement**, multi-candidate **Batch Ranking**, and a full-featured **Admin Portal**.

---

## 🚀 Key Features

### For Job Seekers & Candidates
1. **Interactive Dashboard**: Live metrics for upload history, average ATS scores, highest score trends, and category performance breakdown.
2. **Multi-Format Resume Upload**: Fast drag-and-drop file upload supporting `.pdf`, `.doc`, and `.docx` formats with file validation.
3. **Deep Candidate Parsing Engine**: Heuristic NLP and rule-based parser that extracts contact info, technical & soft skills, work experience, projects, education, certifications, and languages with zero phantom data.
4. **Deterministic ATS Scoring Engine (0–100)**: Evaluates resumes across 7 distinct pillars (Keyword Density, Technical Skills, Experience, Education, Projects, Structure, Formatting).
5. **Google Gemini AI Analysis**: In-depth qualitative summary, top strengths, actionable weaknesses, missing skill recommendations, and recruiter impressions (with automatic rule-based fallback).
6. **AI Resume Improvement**: Context-aware content rewriter providing before/after comparisons and quantifiable bullet points using Google's X-Y-Z formula.
7. **Job Description Matching**: Paste any job target posting to perform skill gap analysis, keyword alignment, and interactive category radar charts.
8. **Resume History & Management**: Chronological upload history with search, status filters, re-parsing, and raw text preview.
9. **User Profile & Account Settings**: Update personal details, contact info, targeted skill portfolios, and security credentials.

### For Recruiters & Hiring Teams
10. **Candidate Ranking System**: High-throughput multi-resume batch processing (supporting up to 20 resumes simultaneously) with customizable weights for skills, experience, education, and job match alignment, automatic tie-breaking, and discrimination-free evaluation.

### For Administrators
11. **Admin Management Suite**: System overview metrics, user administration (role changes, banning/activating), resume database viewer, system audit logs, and health diagnostics.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **React 19** & **Vite** (Blazing fast HMR and optimized production bundles)
- **Tailwind CSS v4** (Modern utility-first CSS design system)
- **React Router DOM v6** (Protected client-side routing & auth guards)
- **Axios** (Configured HTTP client with automatic JWT bearer attachment and silent refresh token interceptors)
- **Chart.js & React-Chartjs-2** (Interactive radar charts and category metrics)
- **Framer Motion** (Fluid micro-interactions and transitions)
- **React Icons** (Feather and FontAwesome icon libraries)
- **Custom Toast Provider** (Lightweight animated notification system)

### Backend (`server/`)
- **Node.js** & **Express.js** (REST API architecture)
- **MongoDB & Mongoose** (Schema validation, relational indexing, and lean aggregations)
- **JWT & bcryptjs** (Secure authentication, access + refresh tokens, bcrypt password hashing)
- **Google OAuth 2.0** (`google-auth-library` ID token verification)
- **@google/genai & Google Gemini AI** (LLM analysis with rule-based fallback)
- **pdf-parse & mammoth** (Robust binary text extraction for PDF and Word documents)
- **Multer** (Disk storage file uploads with size and MIME type validation)
- **Helmet, Compression & CORS** (Production security and performance middlewares)

---

## 📁 Directory Structure

```
mern-resume-analyzer/
├── client/                     # React Single Page Application (SPA)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── assets/             # Images and design assets
│   │   ├── components/         # Reusable UI components (Admin, Common, Dashboard, Landing)
│   │   ├── context/            # AuthContext & state providers
│   │   ├── layouts/            # DashboardLayout & AdminLayout
│   │   ├── pages/              # Admin, Auth, Dashboard, and Public pages
│   │   ├── services/           # Axios API services (auth, resume, ai, jobMatch, recruiter, admin)
│   │   └── utils/              # Export utilities and Google auth helpers
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express REST API Server
│   ├── config/                 # MongoDB database & Multer upload config
│   ├── controllers/            # Route handler logic (auth, resume, ai, jobMatch, recruiter, admin)
│   ├── middleware/             # Auth, Admin RBAC, Error handling, Logger, Validation
│   ├── models/                 # Mongoose data schemas (User, Resume, ResumeAnalysis, AIAnalysis, etc.)
│   ├── routes/                 # Express API router endpoints
│   ├── services/               # Parser, ATS engine, Gemini AI, Job Match, Candidate Ranking
│   ├── uploads/resumes/        # Uploaded resume document storage
│   ├── utils/                  # JWT helpers, response formatters, seed scripts
│   ├── server.js               # Entry point
│   └── package.json
│
├── .env.example                # Template environment variables
├── package.json                # Root package orchestration
└── README.md                   # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas Connection URI)

### 1. Clone the repository
```bash
git clone <repository-url>
cd "mern resume analyzer"
```

### 2. Environment Variables Configuration

#### Root / Server Configuration (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/resume_analyzer?retryWrites=true&w=majority
NODE_ENV=development
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_jwt_access_secret_key_here
REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRE=15m
REFRESH_EXPIRE=7d

# Optional Integrations
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
```

#### Client Configuration (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
```

### 3. Install Dependencies
Install all root, client, and server dependencies with a single command:
```bash
npm run install:all
```

---

## 🏃 Running the Application

### Concurrently (Frontend + Backend)
```bash
npm run dev
```

### Backend Only
```bash
npm run dev:server
```
API runs on `http://localhost:5000`.

### Frontend Only
```bash
npm run dev:client
```
Vite Dev Server runs on `http://localhost:5173`.

---

## 🔌 Main API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate user & get JWT tokens | No |
| `POST` | `/api/auth/google` | Google OAuth token authentication | No |
| `POST` | `/api/auth/refresh` | Refresh expired access token | No (Cookie/Header) |
| `GET` | `/api/auth/profile` | Get current user profile | Yes (User) |
| `PUT` | `/api/auth/profile` | Update profile information | Yes (User) |
| `POST` | `/api/resumes/upload` | Upload a new resume (.pdf, .doc, .docx) | Yes (User) |
| `GET` | `/api/resumes` | Get user's uploaded resumes list | Yes (User) |
| `GET` | `/api/resumes/:id` | Get resume details & extracted data | Yes (User) |
| `POST` | `/api/resumes/:id/parse` | Parse/Re-parse candidate resume data | Yes (User) |
| `POST` | `/api/resumes/:id/analyze` | Calculate ATS score (0-100) & metrics | Yes (User) |
| `POST` | `/api/resumes/:id/auto-analyze` | Trigger full pipeline (Parse -> ATS -> AI) | Yes (User) |
| `GET` | `/api/resumes/:id/complete-analysis` | Get unified report (Resume + ATS + AI) | Yes (User) |
| `DELETE` | `/api/resumes/:id` | Delete resume and associated analyses | Yes (User) |
| `POST` | `/api/ai/analyze/:resumeId` | Generate Google Gemini AI insights | Yes (User) |
| `POST` | `/api/ai/improve/:resumeId` | Generate full AI resume improvement | Yes (User) |
| `POST` | `/api/job-match/analyze` | Compare resume against job description | Yes (User) |
| `GET` | `/api/job-match/history` | Get user's saved job match reports | Yes (User) |
| `POST` | `/api/recruiter/rank-resumes` | Batch upload & rank candidate resumes | Yes (User/Admin) |
| `GET` | `/api/recruiter/rankings` | Get past candidate ranking sessions | Yes (User/Admin) |
| `GET` | `/api/dashboard/stats` | Live user statistics and score history | Yes (User) |
| `GET` | `/api/admin/dashboard` | Admin platform metrics | Yes (Admin) |
| `GET` | `/api/admin/users` | Manage system users with pagination | Yes (Admin) |
| `GET` | `/api/admin/resumes` | Platform-wide resumes manager | Yes (Admin) |
| `GET` | `/api/health` | Service and MongoDB health check | No |

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive automated test suite across all modules:

```bash
# Run Complete End-to-End Test Suite (94 Integration Tests)
node server/test_e2e_full.js

# Run Resume Parser Extraction Test Suite (74 Layout & Edge-Case Tests)
node server/test_parser.js

# Run Recruiter Candidate Ranking Test Suite (36 Batch & Scoring Tests)
node server/test_candidate_ranking.js

# Run Skill Matching Accuracy Tests
node server/test_skill_matching_accuracy.js

# Run Auto-Analysis Pipeline Tests
node server/test_auto_analysis_workflow.js

# Run Google OAuth Authentication Tests
node server/test_google_oauth_workflow.js

# Run Live HTTP API Integration Tests (Requires server running on port 5000)
node server/test_live_http_api.js
node server/test_live_auto_workflow_api.js
node server/test_live_rank_workflow.js

# Run Frontend Linter & Build Verification
npm run lint --prefix client
npm run build --prefix client
```

---

## 🛡️ License
This project is licensed under the MIT License.
