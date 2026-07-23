import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: [true, 'Associated Resume ID is required.']
  },
  atsScore: {
    type: Number,
    required: [true, 'Overall ATS score is required.'],
    min: [0, 'ATS score cannot be less than 0.'],
    max: [100, 'ATS score cannot be more than 100.']
  },
  keywordScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  skillsScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  formattingScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  educationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  experienceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  recruiterFeedback: {
    type: [String],
    default: []
  },
  aiSuggestions: {
    type: [String],
    default: []
  },
  strengths: {
    type: [String],
    default: []
  },
  weaknesses: {
    type: [String],
    default: []
  },
  missingKeywords: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Explicit Indexes
resumeAnalysisSchema.index({ resume: 1 });
resumeAnalysisSchema.index({ createdAt: -1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

export default ResumeAnalysis;
