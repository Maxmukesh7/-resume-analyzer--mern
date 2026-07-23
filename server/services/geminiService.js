import dotenv from 'dotenv';
import Resume from '../models/Resume.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import AIAnalysis from '../models/AIAnalysis.js';
import { evaluateResumeAts } from './atsEngineService.js';
import ApiError from '../utils/apiError.js';

dotenv.config();

/**
 * Generate fallback AI response if Gemini API key is missing or fails
 */
function generateFallbackAIAnalysis(parsed, ats) {
  const skillsCount = parsed.skills?.length || 0;
  const expCount = parsed.experience?.length || 0;
  const projCount = parsed.projects?.length || 0;
  const score = ats?.overallScore || 70;

  let rating = 'Good';
  if (score >= 90) rating = 'Excellent';
  else if (score >= 80) rating = 'Very Good';
  else if (score < 70) rating = 'Needs Improvement';

  return {
    summary: `${parsed.fullName || 'Candidate'} is a tech professional with ${skillsCount} core technical skills, ${expCount} work experience entries, and ${projCount} projects. Current ATS evaluation score is ${score}/100 (${rating}).`,
    strengths: [
      `Strong technical foundation with skills in ${parsed.skills?.slice(0, 4).join(', ') || 'software development'}.`,
      parsed.education?.length > 0 ? 'Clear academic qualifications listed.' : 'Demonstrated project building capability.',
      'Machine-readable structured resume layout.'
    ],
    weaknesses: [
      skillsCount < 6 ? 'Low keyword density for specialized modern tech stack.' : 'Bullet points could use more quantitative metrics.',
      projCount < 2 ? 'Sparse project portfolio details.' : 'Missing explicit live deployment links.'
    ],
    missingSkills: ats?.missingKeywords?.slice(0, 5) || ['Docker', 'CI/CD Pipelines', 'AWS', 'TypeScript', 'Jest'],
    recommendations: [
      'Quantify achievements in work experience using percentages, revenue, or performance improvements.',
      'Inject missing industry keywords to maximize ATS filter ranking.',
      'Include live links to GitHub repositories or deployed demo applications.'
    ],
    careerSuggestions: [
      'Target Full Stack Software Engineer or Frontend Developer roles based on tech stack.',
      'Obtain industry-recognized cloud certifications (e.g. AWS Certified Developer).'
    ],
    priorityActions: [
      'Add 2+ projects with live deployment links.',
      'Include action verbs (developed, engineered, optimized) at the start of each bullet point.'
    ],
    grammarSuggestions: [
      'Ensure consistent past-tense verbs for past roles and present-tense verbs for current roles.'
    ],
    formattingSuggestions: [
      'Use standard single-column layout without custom graphic tables or icons.'
    ],
    recruiterFeedback: [
      'Recruiters look for clear impact statements within the top half of the first page.'
    ],
    rating
  };
}

/**
 * Call Gemini API or fallback to generate structured AI Analysis
 */
export const generateGeminiResumeAnalysis = async (resumeId, userId, force = false) => {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new ApiError(404, 'Resume not found.');
  }

  if (resume.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You do not have permission to analyze this resume.');
  }

  // Check MongoDB cache
  const existing = await AIAnalysis.findOne({ resumeId });
  if (!force && existing) {
    console.log(`ℹ️ [DEBUG] Cached AI analysis found for Resume ID ${resumeId}.`);
    return existing;
  }

  // Ensure ATS analysis exists
  let ats = await ResumeAnalysis.findOne({ resume: resumeId });
  if (!ats) {
    ats = await evaluateResumeAts(resumeId, userId, false);
  }

  const parsed = resume.parsedData || {};
  const rawTextSnippet = (resume.parsedText || '').slice(0, 2000);

  const apiKey = process.env.GEMINI_API_KEY;
  let aiResult = null;

  if (apiKey && apiKey.trim().length > 10) {
    try {
      console.log(`🤖 [DEBUG] Calling Google Gemini API for Resume ID ${resumeId}...`);

      const promptText = `You are an expert AI Resume Reviewer & Executive Recruiter.
Analyze the following candidate resume data and ATS evaluation metrics.
Return ONLY valid JSON matching this structure without Markdown backticks:
{
  "summary": "Professional summary...",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "missingSkills": ["skill1", "skill2"],
  "recommendations": ["rec1", "rec2"],
  "careerSuggestions": ["career1", "career2"],
  "priorityActions": ["action1", "action2"],
  "grammarSuggestions": ["grammar1"],
  "formattingSuggestions": ["format1"],
  "recruiterFeedback": ["feedback1"],
  "rating": "Excellent"
}

Candidate Data:
Name: ${parsed.fullName || 'Candidate'}
Email: ${parsed.email || 'N/A'}
Skills: ${JSON.stringify(parsed.skills || [])}
Education: ${JSON.stringify(parsed.education || [])}
Experience: ${JSON.stringify(parsed.experience || [])}
Projects: ${JSON.stringify(parsed.projects || [])}
ATS Score: ${ats.overallScore}/100 (${ats.ratingLabel})
Missing Keywords: ${JSON.stringify(ats.missingKeywords || [])}
Resume Excerpt: ${rawTextSnippet}`;

      // Gemini REST API endpoint
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
        const responseText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          try {
            const cleanJsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            aiResult = JSON.parse(cleanJsonStr);
            console.log('✅ [DEBUG] Successfully parsed Gemini API JSON response!');
          } catch (pErr) {
            console.warn('⚠️ Could not parse Gemini JSON response, falling back:', pErr.message);
          }
        }
      } else {
        console.warn(`⚠️ Gemini API returned HTTP ${response.status}. Using fallback evaluation.`);
      }
    } catch (gErr) {
      console.warn('⚠️ Gemini API request error:', gErr.message);
    }
  } else {
    console.log('ℹ️ [DEBUG] GEMINI_API_KEY not configured or empty. Using rule-based fallback AI engine.');
  }

  if (!aiResult || !aiResult.summary) {
    aiResult = generateFallbackAIAnalysis(parsed, ats);
  }

  // Create or Update AIAnalysis in MongoDB
  const savedAnalysis = await AIAnalysis.findOneAndUpdate(
    { resumeId },
    {
      resumeId,
      userId,
      summary: aiResult.summary,
      strengths: aiResult.strengths || [],
      weaknesses: aiResult.weaknesses || [],
      missingSkills: aiResult.missingSkills || [],
      recommendations: aiResult.recommendations || [],
      careerSuggestions: aiResult.careerSuggestions || [],
      priorityActions: aiResult.priorityActions || [],
      grammarSuggestions: aiResult.grammarSuggestions || [],
      formattingSuggestions: aiResult.formattingSuggestions || [],
      recruiterFeedback: aiResult.recruiterFeedback || [],
      rating: aiResult.rating || 'Good'
    },
    { new: true, upsert: true, runValidators: true }
  );

  return savedAnalysis;
};
