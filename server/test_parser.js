/**
 * Parser Comprehensive Test Suite
 * Tests: ATS, 2-Column, Minimal, Fresher, Experienced, Edge Cases
 */
import { parseCandidateDetails } from './services/resumeParserService.js';

const PASS = '✅ PASSED';
const FAIL = '❌ FAILED';
let totalPassed = 0, totalTests = 0;

function assert(label, condition) {
  totalTests++;
  if (condition) {
    totalPassed++;
    console.log(`  ${PASS}  ${label}`);
  } else {
    console.log(`  ${FAIL}  ${label}`);
  }
}

function header(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ─────────────────────────────────────────────────────────────────
// TEMPLATE 1: ATS Standard (1-Column)
// ─────────────────────────────────────────────────────────────────
header('TEST 1 — ATS Standard 1-Column Resume');
const ats = parseCandidateDetails(`
Alex H. Smith
alex.smith@example.com | +1 (555) 234-5678 | San Francisco, CA
https://linkedin.com/in/alexhsmith | https://github.com/alexsmith

PROFESSIONAL SUMMARY
Results-driven Full Stack Engineer with 5+ years of experience building scalable web applications.

TECHNICAL SKILLS
JavaScript, TypeScript, Python, React, Next.js, Node.js, MongoDB, PostgreSQL, AWS, Docker, Git

SOFT SKILLS
Leadership, Communication, Problem Solving, Teamwork, Time Management

WORK EXPERIENCE
Senior Full Stack Engineer | TechCorp Solutions | Jan 2021 – Present
• Migrated monolith to microservices, reducing API latency by 45%.
• Built React + Tailwind UI serving 200,000 monthly users.

Software Developer | Innovate Software | June 2018 – Dec 2020
• Developed RESTful APIs with Node.js, Express, PostgreSQL.
• Implemented OAuth2 and JWT for SaaS authentication.

PROJECTS
AI Resume Analyzer | React, Node.js, MongoDB | Aug 2023 – Oct 2023
• Built NLP-based resume analysis with ATS scoring.

E-Commerce Platform | Next.js, Stripe, PostgreSQL | Jan 2023 – Apr 2023
• Full-featured shopping cart with Stripe checkout.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2014 – 2018 | CGPA 3.8/4.0

CERTIFICATIONS
• AWS Certified Solutions Architect – Associate
• Certified Scrum Master (CSM)

SPOKEN LANGUAGES
English (Native), Spanish (Professional)
`);

console.log(`  Name: "${ats.fullName}" | Email: "${ats.email}" | Phone: "${ats.phone}"`);
console.log(`  Location: "${ats.location}" | Projects: ${ats.projects.length} | Experience: ${ats.experience.length}`);
assert('Full name extracted', !!ats.fullName && ats.fullName !== '');
assert('Email extracted', ats.email === 'alex.smith@example.com');
assert('Phone extracted', !!ats.phone);
assert('Location = San Francisco area', ats.location?.includes('San Francisco'));
assert('LinkedIn extracted', ats.linkedin?.includes('linkedin.com'));
assert('GitHub extracted', ats.github?.includes('github.com'));
assert('Summary extracted', ats.summary?.length > 20);
assert('Tech skills found (>=5)', ats.technicalSkills.length >= 5);
assert('Soft skills found', ats.softSkills.length > 0);
assert('2 experience entries', ats.experience.length === 2);
assert('2 projects extracted', ats.projects.length === 2);
assert('Project 1 = AI Resume Analyzer', ats.projects[0]?.title?.includes('AI Resume Analyzer'));
assert('Project 2 = E-Commerce Platform', ats.projects[1]?.title?.includes('E-Commerce'));
assert('1 education entry', ats.education.length === 1);
assert('2 certifications', ats.certifications.length === 2);
assert('Languages found', ats.languages.includes('English'));

// ─────────────────────────────────────────────────────────────────
// TEMPLATE 2: 2-Column Modern Resume
// ─────────────────────────────────────────────────────────────────
header('TEST 2 — 2-Column Modern Resume');
const twocol = parseCandidateDetails(`
MUKESH KUMAR
mukesh.kumar@techmail.com • +91 98765 43210 • Bengaluru, India
github.com/mukeshkumar • linkedin.com/in/mukesh-kumar-dev

CAREER PROFILE
Versatile Software Engineer specializing in MERN stack and cloud architectures.

CORE COMPETENCIES & TECH STACK
JavaScript, ReactJS, NodeJS, Express, MongoDB, Python, Docker, GraphQL

EMPLOYMENT HISTORY
Software Engineer at Global Tech Inc. (July 2022 – Present)
- Engineered real-time WebSockets service handling 50k concurrent connections.
- Optimised MongoDB query performance by 70%.

Associate Developer at Cloud Systems (Aug 2021 – June 2022)
- Built React + TypeScript dashboard components.

KEY PROJECTS
Real-time Analytics Dashboard | React, Node.js, Socket.io | 2023
- Built live data visualisation for server telemetry.

Smart Inventory System | Next.js, MongoDB | 2022
- Automated stock management with barcode scanning support.

ACADEMIC QUALIFICATIONS
B.Tech in Information Technology from Anna University (2017 – 2021) | 8.5 CGPA

COURSES & CREDENTIALS
- Deep Learning Specialization (Coursera)
- MongoDB Certified Developer

LANGUAGES SPOKEN
English, Hindi, Tamil
`);

console.log(`  Name: "${twocol.fullName}" | Location: "${twocol.location}" | Proj: ${twocol.projects.length} | Exp: ${twocol.experience.length}`);
assert('Name extracted', !!twocol.fullName);
assert('Email extracted', twocol.email?.includes('@'));
assert('Phone extracted (international)', !!twocol.phone);
assert('Location = Bengaluru', twocol.location?.toLowerCase().includes('bengaluru'));
assert('2 experience entries', twocol.experience.length === 2);
assert('2 projects extracted', twocol.projects.length === 2);
assert('1 education entry', twocol.education.length === 1);
assert('Certifications extracted', twocol.certifications.length >= 1);
assert('Languages found', twocol.languages.includes('English'));

// ─────────────────────────────────────────────────────────────────
// TEMPLATE 3: Fresher Resume (No Work Experience)
// ─────────────────────────────────────────────────────────────────
header('TEST 3 — Fresher Resume (NO Work Experience)');
const fresher = parseCandidateDetails(`
Rohan Verma
rohan.verma@student.edu | +91 91234 56789 | Delhi, India
linkedin.com/in/rohanverma | github.com/rohanverma

OBJECTIVE
Passionate CS graduate eager to start a Full Stack career. Proficient in React, Node.js, JavaScript, HTML, CSS, Git.

EDUCATION
B.Tech in Computer Science and Engineering | IIT Delhi | 2020 – 2024 | 8.8 CGPA

ACADEMIC PROJECTS
Smart Health Monitor | React, Express, MongoDB | Jan 2024 – Apr 2024
- IoT patient monitoring dashboard with real-time alerts.

Portfolio Website | React, Tailwind CSS | 2023
- Responsive developer portfolio hosted on Vercel.

CERTIFICATIONS & TRAINING
- Full Stack Web Development (Udemy)
- Problem Solving (HackerRank)

LANGUAGES
English, Hindi
`);

console.log(`  Name: "${fresher.fullName}" | Exp: ${fresher.experience.length} | Proj: ${fresher.projects.length}`);
assert('Name extracted', !!fresher.fullName);
assert('Email extracted', !!fresher.email);
assert('experience is EMPTY []', fresher.experience.length === 0);
assert('2 projects extracted', fresher.projects.length === 2);
assert('Project 1 = Smart Health Monitor', fresher.projects[0]?.title?.includes('Smart Health Monitor'));
assert('Project 2 = Portfolio', fresher.projects[1]?.title?.toLowerCase().includes('portfolio'));
assert('Location = Delhi', fresher.location?.toLowerCase().includes('delhi'));
assert('1 education entry', fresher.education.length === 1);
assert('Certifications found', fresher.certifications.length >= 1);

// ─────────────────────────────────────────────────────────────────
// TEMPLATE 4: Minimalist Resume (No Section Headings)
// ─────────────────────────────────────────────────────────────────
header('TEST 4 — Minimalist Resume (Few Headings)');
const minimal = parseCandidateDetails(`
Sarah Connor
sarah.connor@cyberdyne.io | +1-800-555-0199 | Los Angeles, CA

Experienced Systems Engineer with expertise in C++, Python, Docker, SQL, Machine Learning.

WORK EXPERIENCE
Systems Engineer at Cyberdyne Systems (2020 – 2023)
- Developed autonomous tracking systems using C++ and OpenCV.

PROJECTS
Autonomous Tracking Module | Python, PyTorch | 2022
- Built target recognition model with 96% classification precision.

EDUCATION
B.E. Computer Engineering from UCLA (2016 – 2020) | 3.9 GPA
`);

console.log(`  Name: "${minimal.fullName}" | Exp: ${minimal.experience.length} | Proj: ${minimal.projects.length} | Location: "${minimal.location}"`);
assert('Name extracted', minimal.fullName?.includes('Sarah'));
assert('Email extracted', !!minimal.email);
assert('Phone extracted', !!minimal.phone);
assert('Location = Los Angeles area', minimal.location?.toLowerCase().includes('los angeles'));
assert('1 experience entry', minimal.experience.length === 1);
assert('1 project extracted', minimal.projects.length === 1);
assert('1 education entry', minimal.education.length === 1);
assert('Location is NOT a project/school name', !['autonomous','ucla'].includes((minimal.location||'').toLowerCase()));

// ─────────────────────────────────────────────────────────────────
// TEMPLATE 5: Senior Enterprise Resume
// ─────────────────────────────────────────────────────────────────
header('TEST 5 — Senior Enterprise Architect Resume');
const senior = parseCandidateDetails(`
David L. Miller
david.miller@enterprise.com | +1 (415) 890-1234 | Seattle, WA
linkedin.com/in/davidlmiller | github.com/davidmiller-arch

EXECUTIVE SUMMARY
Senior Enterprise Software Architect with 12+ years leading cross-functional teams and designing distributed microservices on AWS and Azure.

SKILLS & TOOLS
Languages: Java, Go, Python, TypeScript, SQL
Cloud: AWS, Azure, Docker, Kubernetes, Terraform, CI/CD
Frameworks: Spring Boot, Node.js, NestJS, React, GraphQL, Kafka, Redis
Practices: System Design, Agile, TDD, Leadership, Communication

WORK HISTORY
Principal Architect | CloudScale Inc. | March 2019 – Present
- Migrated 40+ microservices to Kubernetes on AWS.
- Saved $1.2M annually through autoscaling optimisation.

Senior Software Engineer | MicroSystems Corp | Feb 2014 – Feb 2019
- Architected Kafka-based streaming platform handling 2B daily events.

SELECTED PROJECTS
Global Cloud Gateway | Go, Docker, AWS | 2022
- Designed edge routing handling 100M daily HTTP requests.

ML Pipeline Orchestrator | Python, Kubernetes | 2021
- Automated model training and deployment workflow.

ACADEMIC BACKGROUND
Master of Science in Software Engineering | University of Washington | 2012 – 2014
Bachelor of Engineering in Computer Science | WSU | 2008 – 2012

CREDENTIALS & LICENSES
- AWS Certified Solutions Architect Professional
- Certified Kubernetes Administrator (CKA)

SPOKEN LANGUAGES
English, German
`);

console.log(`  Name: "${senior.fullName}" | Exp: ${senior.experience.length} | Proj: ${senior.projects.length} | Edu: ${senior.education.length}`);
assert('Name extracted', senior.fullName?.includes('David'));
assert('Email extracted', !!senior.email);
assert('Location = Seattle', senior.location?.toLowerCase().includes('seattle'));
assert('2 experience entries', senior.experience.length === 2);
assert('2 projects extracted', senior.projects.length === 2);
assert('2 education entries', senior.education.length === 2);
assert('Tech skills >= 10', senior.technicalSkills.length >= 10);
assert('Certifications found', senior.certifications.length >= 2);

// ─────────────────────────────────────────────────────────────────
// TEMPLATE 6: Edge Case — No Location, Company Named Like City
// ─────────────────────────────────────────────────────────────────
header('TEST 6 — Edge Case: No Location, Company Body Text');
const edgeCase = parseCandidateDetails(`
Alexander Vance
alex.vance@techcorp.io | +1 (555) 890-1234

SUMMARY
Software Engineer skilled in Python, Java, Docker, and AWS.

PROJECTS
Smart Grid Telemetry | Python, AWS | 2023
- Built live data monitoring for power grid metrics.

Inventory Tracker | Node.js, MongoDB | 2022
- Automated stock management system.

WORK EXPERIENCE
Software Developer at CloudTech Solutions (2021 – 2023)
- Built scalable microservices backend using Python and Flask.

EDUCATION
Bachelor of Science from University of Washington (2017 – 2021)
`);

console.log(`  Location: "${edgeCase.location}" | Exp: ${edgeCase.experience.length} | Proj: ${edgeCase.projects.length}`);
assert('Location is null (no location in header)', edgeCase.location === null);
assert('1 experience entry (NOT project)', edgeCase.experience.length === 1);
assert('2 projects extracted', edgeCase.projects.length === 2);
assert('Project 1 = Smart Grid Telemetry', edgeCase.projects[0]?.title?.includes('Smart Grid'));
assert('Project 2 = Inventory Tracker', edgeCase.projects[1]?.title?.includes('Inventory'));
assert('Location NOT equal to project title', edgeCase.location !== 'Smart Grid Telemetry');
assert('Location NOT equal to university name', edgeCase.location !== 'University of Washington');

// ─────────────────────────────────────────────────────────────────
// PROJECT BOUNDARY TESTS (new — target bug regression)
// ─────────────────────────────────────────────────────────────────

header('TEST 7 — 1 Project with Fragment Description (Regression Bug)');
// The bug: "usage." at the end of a description was being treated as a new project.
const phantom = parseCandidateDetails(`
Jane Doe
jane.doe@example.com | +1 555-0000 | Austin, TX

PROJECTS
Smart Budget Tracker | React, Node.js, MongoDB | Jan 2024 – Mar 2024
- Built a personal finance dashboard for tracking monthly budget usage.
- Integrated Plaid API for automated bank data import and real-time updates.

EDUCATION
B.Sc. Computer Science, MIT (2020 – 2024)
`);
console.log(`  Projects found: ${phantom.projects.length} | Titles: ${phantom.projects.map(p => p.title).join(', ')}`);
assert('Exactly 1 project (NOT 2 or 3)', phantom.projects.length === 1);
assert('Project title = Smart Budget Tracker', phantom.projects[0]?.title?.includes('Smart Budget Tracker'));
assert('"usage." NOT treated as a project', !phantom.projects.some(p => /^usage/i.test(p.title)));
assert('Bullet points merged into single project', phantom.projects[0]?.bulletPoints?.length >= 1);

// ─────────────────────────────────────────────────────────────────
header('TEST 8 — 2 Projects, No Sentence Fragments as Titles');
const twoProj = parseCandidateDetails(`
Sam Wilson
sam.wilson@email.com | +44 7700 000000 | London, UK

PROJECTS
E-Commerce API | Node.js, Express, PostgreSQL | 2023
Built RESTful API supporting 10k+ transactions per day. Reduced query time by 60% through indexing.

Portfolio Website | React, Tailwind CSS | 2022
Responsive personal portfolio deployed on Vercel with automated CI/CD.

EDUCATION
BSc Software Engineering | UCL (2019 – 2023)
`);
console.log(`  Projects: ${twoProj.projects.length} | Titles: ${twoProj.projects.map(p => p.title).join(', ')}`);
assert('Exactly 2 projects', twoProj.projects.length === 2);
assert('Project 1 = E-Commerce API', twoProj.projects[0]?.title?.includes('E-Commerce API'));
assert('Project 2 = Portfolio Website', twoProj.projects[1]?.title?.includes('Portfolio Website'));

// ─────────────────────────────────────────────────────────────────
header('TEST 9 — 3 Projects All Extracted Correctly');
const threeProj = parseCandidateDetails(`
Priya Sharma
priya.sharma@dev.in | +91 98000 11111 | Bangalore, India

ACADEMIC PROJECTS
AI Chatbot Platform | Python, FastAPI, MongoDB | Jan 2024 – Mar 2024
- Conversational AI using Rasa + GPT-3 integration.
- Deployed on AWS EC2 with Nginx reverse proxy.

Inventory Management System | React, Node.js, MySQL | Aug 2023 – Dec 2023
- Role-based access for admin and staff with JWT auth.
- Barcode scan integration using ZXing.

Blog CMS | Next.js, Prisma, PostgreSQL | 2022
- Markdown-based blog engine with SEO meta tags.

EDUCATION
B.Tech IT | VTU (2020 – 2024) | 8.9 CGPA
`);
console.log(`  Projects: ${threeProj.projects.length} | Titles: ${threeProj.projects.map(p => p.title).join(' | ')}`);
assert('Exactly 3 projects', threeProj.projects.length === 3);
assert('Project 1 = AI Chatbot Platform', threeProj.projects[0]?.title?.includes('AI Chatbot Platform'));
assert('Project 2 = Inventory Management System', threeProj.projects[1]?.title?.includes('Inventory Management'));
assert('Project 3 = Blog CMS', threeProj.projects[2]?.title?.includes('Blog CMS'));

// ─────────────────────────────────────────────────────────────────
header('TEST 10 — 5 Projects All Extracted, No Phantom Projects');
const fiveProj = parseCandidateDetails(`
Carlos Rivera
carlos.rivera@portfolio.io | +1 312-000-0001 | Chicago, IL
github.com/carlosrivera

FEATURED PROJECTS
Weather Dashboard | React, OpenWeather API | 2024
Real-time weather app with hourly/weekly forecasts and geolocation support.

Task Manager App | Vue.js, Firebase | 2023
Kanban-style task board with real-time sync and team collaboration features.

Online Exam Portal | Django, PostgreSQL, Redis | 2023
Automated grading system with anti-cheat detection for 5,000+ students.

Crypto Tracker | Next.js, CoinGecko API | 2022
Live cryptocurrency price tracker with portfolio management and alerts.

Smart Notes App | React Native, SQLite | 2022
Cross-platform notes app with offline sync, tags, and voice-to-text input.

EDUCATION
B.S. CS | University of Illinois at Chicago (2019 – 2023)
`);
console.log(`  Projects: ${fiveProj.projects.length} | Titles: ${fiveProj.projects.map(p => p.title).join(' | ')}`);
assert('Exactly 5 projects', fiveProj.projects.length === 5);
assert('Project 1 = Weather Dashboard', fiveProj.projects[0]?.title?.includes('Weather Dashboard'));
assert('Project 2 = Task Manager App', fiveProj.projects[1]?.title?.includes('Task Manager'));
assert('Project 3 = Online Exam Portal', fiveProj.projects[2]?.title?.includes('Online Exam'));
assert('Project 4 = Crypto Tracker', fiveProj.projects[3]?.title?.includes('Crypto Tracker'));
assert('Project 5 = Smart Notes App', fiveProj.projects[4]?.title?.includes('Smart Notes'));

// ─────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────
const pct = Math.round((totalPassed / totalTests) * 100);
console.log(`\n${'═'.repeat(60)}`);
console.log('  FINAL RESULTS');
console.log('═'.repeat(60));
console.log(`  Tests Passed : ${totalPassed} / ${totalTests}`);
console.log(`  Accuracy     : ${pct}%`);
console.log(`  Status       : ${pct >= 90 ? '✅ TARGET MET (≥90%)' : '❌ BELOW TARGET'}`);
console.log('═'.repeat(60));
