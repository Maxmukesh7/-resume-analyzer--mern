import dotenv from 'dotenv';
import Resume from '../models/Resume.js';
import ResumeImprovement from '../models/ResumeImprovement.js';
import ApiError from '../utils/apiError.js';
import { parseAndSaveResume } from './resumeParserService.js';

dotenv.config();

/**
 * Generate fallback AI improved resume payload if Gemini API key is missing or fails
 */
function generateFallbackImprovement(parsed, options = {}) {
  const { targetJobDescription = '', experienceLevel = 'Experienced' } = options;
  const fullName = parsed.fullName || 'Candidate';
  const rawSkills = parsed.skills || [];

  // Summary improvement fallback logic
  const isFresher = (experienceLevel || '').toLowerCase() === 'fresher' || (parsed.experience?.length || 0) === 0;
  
  let improvedSummary = isFresher
    ? `Highly motivated and detail-oriented Computer Science professional with a strong foundation in modern software engineering principles, full-stack application development, and problem solving. Demonstrated hands-on expertise in building responsive web applications using ${rawSkills.slice(0, 4).join(', ') || 'React, Node.js, and modern JavaScript'}. Eager to leverage technical skills, quick learning capabilities, and collaborative mindset to contribute effectively to high-impact development projects.`
    : `Results-driven Software Engineer with extensive experience in designing, building, and deploying scalable web applications and distributed systems. Proficient across the full software lifecycle with specialized expertise in ${rawSkills.slice(0, 5).join(', ') || 'JavaScript, MERN Stack, and Cloud Architectures'}. Proven track record of optimizing application performance, implementing robust API endpoints, and delivering business value through clean, maintainable code.`;

  if (targetJobDescription && targetJobDescription.trim().length > 10) {
    improvedSummary += ` Specifically aligned with target role requirements emphasizing system scalability, clean architecture, and modern industry best practices.`;
  }

  // Experience bullet points enhancer fallback
  const improvedExperience = (parsed.experience || []).map((exp) => {
    const rawBullets = exp.bulletPoints || (exp.description ? [exp.description] : []);
    const enhancedBullets = rawBullets.map((b) => {
      let trimmed = b.trim().replace(/^\s*[-•*]\s*/, '');
      if (!trimmed) return 'Engineered scalable features using industry standard design patterns, improving system throughput and reliability.';
      
      // If short bullet, enhance with metrics & verbs
      if (!/developed|engineered|designed|architected|optimized|implemented|spearheaded/i.test(trimmed)) {
        trimmed = `Engineered and optimized ${trimmed.toLowerCase()}, enhancing system performance and user satisfaction across production workloads.`;
      }
      if (!/\d+%|\d+x|\d+ms|million|thousand|users/i.test(trimmed)) {
        trimmed += ' resulting in a 25% increase in operational efficiency and zero critical downtime.';
      }
      return trimmed;
    });

    if (enhancedBullets.length === 0) {
      enhancedBullets.push(
        `Architected and deployed responsive modules for ${exp.company || 'production environment'} utilizing ${rawSkills.slice(0, 3).join(', ') || 'modern frameworks'}, driving a 30% speed improvement in data processing.`
      );
    }

    return {
      company: exp.company || 'Technology Organization',
      role: exp.role || 'Software Engineer',
      description: exp.description || 'Full stack development and feature delivery.',
      bulletPoints: enhancedBullets,
      period: exp.period || '2022 - Present'
    };
  });

  // Projects improvement fallback
  const improvedProjects = (parsed.projects || []).map((proj) => {
    const rawBullets = proj.bulletPoints || (proj.description ? [proj.description] : []);
    const enhancedBullets = rawBullets.map((b) => {
      let trimmed = b.trim().replace(/^\s*[-•*]\s*/, '');
      if (!trimmed) return 'Developed and deployed high-performance application modules using modern state management and clean REST API endpoints.';
      if (!/deployed|built|designed|implemented|integrated/i.test(trimmed)) {
        trimmed = `Designed and built ${trimmed.toLowerCase()} with focus on maintainable clean code architecture and seamless user interface responsiveness.`;
      }
      if (!/deployed|github|ci\/cd|cloud|docker/i.test(trimmed)) {
        trimmed += ' and established automated build workflows for rapid production releases.';
      }
      return trimmed;
    });

    if (enhancedBullets.length === 0) {
      enhancedBullets.push(
        `Built and published ${proj.title || 'Full Stack Application'} using ${proj.technologies?.join(', ') || 'React, Node.js, and MongoDB'}, supporting real-time data synchronization and responsive UI design.`
      );
    }

    return {
      title: proj.title || 'MERN Stack Web Application',
      description: proj.description || 'Full stack web application with real-time capabilities.',
      bulletPoints: enhancedBullets,
      technologies: proj.technologies?.length ? proj.technologies : ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS']
    };
  });

  // Recommended Skills breakdown
  const recommendedSkills = {
    technicalSkills: Array.from(new Set([...rawSkills, 'TypeScript', 'GraphQL', 'RESTful APIs', 'Data Structures & Algorithms'])),
    softSkills: ['Agile Team Collaboration', 'Problem Solving', 'Code Review & Mentorship', 'Technical Documentation', 'Cross-Functional Communication'],
    frameworks: ['React.js', 'Node.js', 'Express.js', 'Next.js', 'Tailwind CSS'],
    cloudTechnologies: ['AWS (S3, EC2)', 'Docker Containerization', 'Vercel / Render Deployment', 'MongoDB Atlas'],
    devOpsTools: ['Git & GitHub Actions', 'CI/CD Pipelines', 'Jest / Vitest Unit Testing', 'Postman API Testing']
  };

  const optimizationNotes = [
    'Transformed summary into an impact-oriented professional pitch with quantified focus.',
    'Enhanced bullet points with strong action verbs (Engineered, Architected, Spearheaded) and performance metrics (25%+ efficiency boost).',
    'Categorized recommended skills across Technical, Soft, Frameworks, Cloud, and DevOps domains for maximum recruiter appeal.',
    targetJobDescription ? 'Tailored resume key terminology to mirror target job description requirements.' : 'Standardized formatting and section hierarchy to surpass modern ATS parsing thresholds.'
  ];

  return {
    improvedSummary,
    improvedExperience,
    improvedProjects,
    recommendedSkills,
    optimizationNotes
  };
}

/**
 * Call Gemini API or use NLP fallback to generate AI Resume Improvement
 */
export const improveFullResumeService = async (resumeId, userId, options = {}) => {
  const { targetJobDescription = '', experienceLevel = 'Experienced', industry = 'Software Engineering', force = false } = options;

  let resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to modify this resume.');
  }

  // Ensure candidate resume parsedData has summary field populated
  if (resume.parsedData && typeof resume.parsedData.summary !== 'string') {
    resume = await parseAndSaveResume(resumeId, false);
  }

  // Check MongoDB cache unless force regenerate
  if (!force) {
    const existing = await ResumeImprovement.findOne({ resumeId, userId });
    if (existing) {
      console.log(`ℹ️ [DEBUG] Found cached ResumeImprovement for resume ${resumeId}`);
      if (resume.parsedData?.summary && (!existing.originalResume?.summary || existing.originalResume.summary.length === 0)) {
        existing.originalResume = {
          ...(existing.originalResume || {}),
          summary: resume.parsedData.summary
        };
        await existing.save();
      }
      return existing;
    }
  }

  const parsed = resume.parsedData || {};
  const apiKey = process.env.GEMINI_API_KEY;
  let aiResult = null;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      console.log(`🤖 [DEBUG] Calling Gemini API for AI Resume Improvement on resume ${resumeId}...`);
      const promptText = `You are an elite Recruiter and AI Resume Optimization Expert.
Your task is to take candidate resume details and produce an improved, ATS-optimized, metric-driven version.

Parameters:
- Target Job Description: ${targetJobDescription || 'General Senior Software Developer / Tech Specialist'}
- Experience Level: ${experienceLevel}
- Target Industry: ${industry}

Input Candidate Data:
Name: ${parsed.fullName || 'Candidate'}
Current Summary: ${parsed.summary || 'N/A'}
Skills: ${JSON.stringify(parsed.skills || [])}
Experience: ${JSON.stringify(parsed.experience || [])}
Projects: ${JSON.stringify(parsed.projects || [])}

Instructions:
1. Rewrite the professional summary into a high-impact, ATS-optimized pitch tailored to the candidate's level (${experienceLevel}).
2. Rewrite work experience bullet points: start with strong action verbs (Engineered, Architected, Implemented, Optimized), add context, and include realistic quantified metrics (percentages, speed increases, volume).
3. Enhance project bullet points with deployment details, modern tech stack highlights, and achievements.
4. Provide structured skills recommendations categorized strictly into:
   - technicalSkills (Array of strings)
   - softSkills (Array of strings)
   - frameworks (Array of strings)
   - cloudTechnologies (Array of strings)
   - devOpsTools (Array of strings)
5. Provide concise optimization notes explaining key changes made.

Return ONLY a valid JSON object matching this EXACT structure with no markdown backticks:
{
  "improvedSummary": "...",
  "improvedExperience": [
    {
      "company": "...",
      "role": "...",
      "description": "...",
      "bulletPoints": ["bullet 1", "bullet 2"],
      "period": "..."
    }
  ],
  "improvedProjects": [
    {
      "title": "...",
      "description": "...",
      "bulletPoints": ["bullet 1", "bullet 2"],
      "technologies": ["tech1", "tech2"]
    }
  ],
  "recommendedSkills": {
    "technicalSkills": ["..."],
    "softSkills": ["..."],
    "frameworks": ["..."],
    "cloudTechnologies": ["..."],
    "devOpsTools": ["..."]
  },
  "optimizationNotes": ["note 1", "note 2"]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      
      // Controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const resData = await response.json();
        const responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          const cleanJsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          aiResult = JSON.parse(cleanJsonStr);
          console.log('✅ [DEBUG] Successfully parsed Gemini API JSON for Resume Improvement!');
        }
      } else {
        console.warn(`⚠️ Gemini API returned HTTP ${response.status}. Using fallback improvement engine.`);
      }
    } catch (err) {
      console.warn('⚠️ Gemini API request failed or timed out:', err.message);
    }
  } else {
    console.log('ℹ️ [DEBUG] GEMINI_API_KEY missing. Running rule-based fallback AI improvement service.');
  }

  if (!aiResult || !aiResult.improvedSummary) {
    aiResult = generateFallbackImprovement(parsed, { targetJobDescription, experienceLevel });
  }

  // Construct final MongoDB document payload
  const originalResumePayload = {
    summary: parsed.summary || '',
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    projects: parsed.projects || []
  };

  const improvedResumePayload = {
    summary: aiResult.improvedSummary,
    skills: aiResult.recommendedSkills?.technicalSkills || [],
    experience: aiResult.improvedExperience || [],
    projects: aiResult.improvedProjects || []
  };

  const savedImprovement = await ResumeImprovement.findOneAndUpdate(
    { resumeId, userId },
    {
      userId,
      resumeId,
      originalResume: originalResumePayload,
      improvedResume: improvedResumePayload,
      improvedSummary: aiResult.improvedSummary,
      improvedProjects: aiResult.improvedProjects || [],
      improvedExperience: aiResult.improvedExperience || [],
      recommendedSkills: aiResult.recommendedSkills || {},
      optimizationNotes: aiResult.optimizationNotes || []
    },
    { new: true, upsert: true, runValidators: true }
  );

  return savedImprovement;
};

/**
 * AI Professional Summary Generator (Standalone)
 */
export const rewriteSummaryService = async ({ currentSummary = '', experienceLevel = 'Experienced', targetRole = '', skills = [] }) => {
  const isFresher = (experienceLevel || '').toLowerCase() === 'fresher';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const promptText = `Rewrite the following resume summary into a compelling, ATS-friendly professional summary.
Target Level: ${experienceLevel} (${isFresher ? 'Entry Level / Fresher' : 'Experienced Professional'})
Target Role: ${targetRole || 'Software Engineer'}
Skills: ${JSON.stringify(skills)}
Current Summary: "${currentSummary}"

Return ONLY valid JSON with this format:
{
  "improvedSummary": "...",
  "keyHighlights": ["highlight 1", "highlight 2"]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const txt = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const clean = txt.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(clean);
        }
      }
    } catch (e) {
      console.warn('⚠️ Gemini rewriteSummary error:', e.message);
    }
  }

  // Fallback summary generator
  const skillsText = skills.length > 0 ? skills.slice(0, 4).join(', ') : 'modern tech stacks and software development';
  const fallbackSummary = isFresher
    ? `Ambitious and results-oriented Computer Science graduate with strong hands-on proficiency in ${skillsText}. Adept at designing clean software solutions, building responsive user interfaces, and applying computer science fundamentals to real-world engineering challenges. Seeking an entry-level ${targetRole || 'Software Development'} position to add value from day one.`
    : `Performance-focused ${targetRole || 'Software Engineer'} with hands-on expertise in ${skillsText}. Specialized in architecting scalable web applications, optimizing database performance, and delivering robust full-stack features. Demonstrated success in collaborating across teams to ship clean, maintainable code on tight deadlines.`;

  return {
    improvedSummary: fallbackSummary,
    keyHighlights: ['ATS-optimized phrasing', 'Includes core technology keywords', `Tailored specifically for ${experienceLevel} level`]
  };
};

/**
 * AI Project Rewriter & Bullet Point Enhancer (Standalone)
 */
export const rewriteProjectService = async ({ title = '', description = '', technologies = [], bulletPoints = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const promptText = `Enhance the following project showcase details into high-impact ATS bullet points.
Project Title: ${title}
Description: ${description}
Technologies: ${JSON.stringify(technologies)}
Bullet Points: ${JSON.stringify(bulletPoints)}

Return ONLY valid JSON with this format:
{
  "improvedTitle": "...",
  "improvedDescription": "...",
  "improvedBulletPoints": ["bullet 1", "bullet 2"],
  "technologies": ["tech1", "tech2"]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const txt = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const clean = txt.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(clean);
        }
      }
    } catch (e) {
      console.warn('⚠️ Gemini rewriteProject error:', e.message);
    }
  }

  // Fallback project enhancer
  const techStr = technologies.length > 0 ? technologies.join(', ') : 'MERN Stack & Cloud Tools';
  const enhancedBullets = (bulletPoints.length > 0 ? bulletPoints : [description]).map((b) => {
    let cleanB = (b || '').replace(/^\s*[-•*]\s*/, '').trim();
    if (!cleanB) cleanB = `Architected ${title || 'web project'} backend services and frontend interfaces.`;
    return `Engineered ${cleanB.toLowerCase()} utilizing ${techStr}, improving execution speed by 35% and ensuring seamless cross-browser accessibility.`;
  });

  return {
    improvedTitle: title || 'Full Stack Application',
    improvedDescription: description || `Production-ready application built with ${techStr}.`,
    improvedBulletPoints: enhancedBullets,
    technologies: technologies.length > 0 ? technologies : ['React', 'Node.js', 'MongoDB', 'Tailwind CSS']
  };
};

/**
 * AI Experience Rewriter & Bullet Point Enhancer (Standalone)
 */
export const rewriteExperienceService = async ({ company = '', role = '', description = '', bulletPoints = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const promptText = `Enhance the following work experience details into quantified, action-verb led ATS bullet points.
Company: ${company}
Role: ${role}
Description: ${description}
Bullet Points: ${JSON.stringify(bulletPoints)}

Return ONLY valid JSON with this format:
{
  "improvedCompany": "...",
  "improvedRole": "...",
  "improvedBulletPoints": ["bullet 1", "bullet 2"]
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const txt = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) {
          const clean = txt.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(clean);
        }
      }
    } catch (e) {
      console.warn('⚠️ Gemini rewriteExperience error:', e.message);
    }
  }

  // Fallback experience enhancer
  const enhancedBullets = (bulletPoints.length > 0 ? bulletPoints : [description]).map((b) => {
    let cleanB = (b || '').replace(/^\s*[-•*]\s*/, '').trim();
    if (!cleanB) cleanB = `Developed core feature modules for ${company || 'production systems'}.`;
    return `Spearheaded ${cleanB.toLowerCase()}, enhancing application throughput by 30% and reducing API request latency across high-traffic endpoints.`;
  });

  return {
    improvedCompany: company || 'Tech Corporation',
    improvedRole: role || 'Software Developer',
    improvedBulletPoints: enhancedBullets
  };
};

/**
 * Fetch saved ResumeImprovement document from MongoDB
 */
export const getStoredImprovementsService = async (resumeId, userId) => {
  let resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to view improvements for this resume.');
  }

  // Ensure candidate resume parsedData has summary field populated
  if (resume.parsedData && typeof resume.parsedData.summary !== 'string') {
    resume = await parseAndSaveResume(resumeId, false);
  }

  const improvement = await ResumeImprovement.findOne({ resumeId, userId });
  if (improvement && resume.parsedData?.summary && (!improvement.originalResume?.summary || improvement.originalResume.summary.length === 0)) {
    improvement.originalResume = {
      ...(improvement.originalResume || {}),
      summary: resume.parsedData.summary
    };
    await improvement.save();
  }

  return improvement;
};
