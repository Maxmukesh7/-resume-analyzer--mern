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
- **Phase 1**: Decoupled MERN Folder Setup, Database Configuration, and Initial Server. (Completed)
- **Phase 2**: Landing Page UI Construction & Responsive Design. (Completed)
- **Phase 3**: Single Page Single-Page App Core Components & Workspace Dashboards. (Completed)
- **Phase 4**: Production-Ready Express Backend Foundation & API Route Frameworks. (Current)
- **Phase 5**: Database Integration, JWT Authentication, and Live Parser Connections. (Future)

---

## API Documentation

All routes are prefixed with `/api`.

### 1. Authentication Routes (`/api/auth`)
*   `POST /auth/register`: Create a new user account.
    *   **Payload**: `{ "name": "...", "email": "...", "password": "..." }`
    *   **Response**: `201 Created`
*   `POST /auth/login`: Authenticate email and credentials.
    *   **Payload**: `{ "email": "...", "password": "..." }`
    *   **Response**: `200 OK`
*   `POST /auth/forgot-password`: Dispatch a password reset link.
    *   **Payload**: `{ "email": "..." }`
    *   **Response**: `200 OK`
*   `POST /auth/reset-password/:token`: Reset account password.
    *   **Payload**: `{ "password": "..." }`
    *   **Response**: `200 OK`

### 2. User Management Routes (`/api/users`)
*   `GET /users/profile`: Fetch current user details.
    *   **Response**: `200 OK`
*   `PUT /users/profile`: Modify user settings.
    *   **Payload**: `{ "name": "...", "email": "..." }` (Optional fields)
    *   **Response**: `200 OK`
*   `PUT /users/settings`: Change application display/notifications preferences.
    *   **Payload**: `{ "darkMode": true, "theme": "..." }`
    *   **Response**: `200 OK`

### 3. Resume History Routes (`/api/resume`)
*   `GET /resume/history`: Get list of user's resume uploads (supports `?page=...&limit=...` query parameters).
    *   **Response**: `200 OK`
*   `GET /resume/:id`: Retrieve single resume meta parameters.
    *   **Response**: `200 OK`
*   `DELETE /resume/:id`: Remove scan entry log from user database.
    *   **Response**: `200 OK`

### 4. File Upload Routes (`/api/upload`)
*   `POST /upload`: Upload single document (PDF/DOCX) using Multipart Form-Data.
    *   **Form Param**: `resume` (File)
    *   **Response**: `201 Created`

### 5. Diagnostics Routes (`/api/analysis`)
*   `POST /analysis/scan`: Run AI diagnostic parser scan over resume.
    *   **Payload**: `{ "resumeId": "..." }`
    *   **Response**: `200 OK`
*   `GET /analysis/report/:id`: Retrieve structured diagnostic score records.
    *   **Response**: `200 OK`

### 6. Stats Dashboard Routes (`/api/dashboard`)
*   `GET /dashboard/stats`: Retrieve user's activity numbers and score histories.
    *   **Response**: `200 OK`

### 7. Administrative Routes (`/api/admin`)
*   `GET /admin/stats`: Admin portal overview.
    *   **Response**: `200 OK`

