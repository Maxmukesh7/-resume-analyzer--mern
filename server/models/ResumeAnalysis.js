import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Associated User ID is required.']
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Associated Resume ID is required.']
    },
    overallScore: {
      type: Number,
      required: [true, 'Overall ATS score is required.'],
      min: 0,
      max: 100
    },
    skillsScore: { type: Number, default: 0, min: 0, max: 100 },
    experienceScore: { type: Number, default: 0, min: 0, max: 100 },
    educationScore: { type: Number, default: 0, min: 0, max: 100 },
    projectsScore: { type: Number, default: 0, min: 0, max: 100 },
    structureScore: { type: Number, default: 0, min: 0, max: 100 },
    keywordScore: { type: Number, default: 0, min: 0, max: 100 },
    achievementsScore: { type: Number, default: 0, min: 0, max: 100 },
    certificationsScore: { type: Number, default: 0, min: 0, max: 100 },
    contactScore: { type: Number, default: 0, min: 0, max: 100 },
    formattingScore: { type: Number, default: 0, min: 0, max: 100 },
    ratingLabel: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Needs Improvement'],
      default: 'Needs Improvement'
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    missingSections: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    keywordAnalysis: {
      type: Object,
      default: () => ({
        detectedKeywords: [],
        missingKeywords: [],
        keywordCount: 0,
        keywordDensity: 0
      })
    },
    generatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual alias for backward compatibility (atsScore = overallScore)
resumeAnalysisSchema.virtual('atsScore').get(function () {
  return this.overallScore;
});

// Explicit Indexes
resumeAnalysisSchema.index({ resume: 1 });
resumeAnalysisSchema.index({ user: 1 });
resumeAnalysisSchema.index({ generatedAt: -1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

export default ResumeAnalysis;
