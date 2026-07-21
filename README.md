# AI Resume Analyzer

An industry-grade, scalable, and production-ready MERN stack web application that analyzes resumes using AI.

---

## Project Structure

This project follows a clean, decoupled architecture:

```
mern-resume-analyzer/
├── package.json          # Root orchestration package.json
├── README.md             # Developer guidelines & setup instructions
├── client/               # React (Vite, Tailwind, React Router, Axios)
└── server/               # Express (Node.js, MongoDB, Mongoose, Multer)
```

---

## Tech Stack

### Frontend
- **React 19** & **Vite**
- **Tailwind CSS v4** (Modern utility-first CSS integration)
- **React Router DOM** (Single Page App routing)
- **Axios** (HTTP client for API requests)
- **Framer Motion** (For smooth fluid animations)
- **React Icons** (SVG icon pack)

### Backend
- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose** (Database ORM)
- **Multer** (File upload handling)
- **cors** & **dotenv** (Configuration & Security)

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (Recommended: Node 18 or above)
- [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas URL)

### 1. Clone the repository
```bash
git clone <repository-url>
cd mern-resume-analyzer
```

### 2. Environment Variables Configuration

#### Backend Env Configuration
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/resume_analyzer
NODE_ENV=development
```

#### Frontend Env Configuration
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Installation
You can install all dependencies (for root, client, and server) with a single command from the project root:
```bash
npm run install:all
```

---

## Running the Application

From the root directory:

### Run Both Client & Server Concurrently (Recommended)
```bash
npm run dev
```

### Run Server Only
```bash
npm run dev:server
```

### Run Client Only
```bash
npm run dev:client
```

---

## Project Phases
- **Phase 1**: Initial Project Architecture Setup, Decoupled Folders, Database Config, and Server initialization. (Current)
- **Phase 2**: Authentication & User Management (JWT, bcrypt). (Future)
- **Phase 3**: Resume Upload (Multer) & PDF Text Extraction. (Future)
- **Phase 4**: AI Integration (Gemini/OpenAI Analysis). (Future)
- **Phase 5**: UI Dashboard, Analytics & Styling. (Future)
