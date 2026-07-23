import mongoose from 'mongoose';

const jobMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Associated User ID is required.']
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Associated Resume ID is required.']
    },
    jobTitle: {
      type: String,
      default: 'Target Role'
    },
    companyName: {
      type: String,
      default: 'Target Company'
    },
    jobDescription: {
      type: String,
      required: [true, 'Job Description text is required.']
    },
    matchScore: {
      type: Number,
      required: [true, 'Match percentage score is required.'],
      min: 0,
      max: 100
    },
    matchedSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [String],
      default: []
    },
    matchedKeywords: {
      type: [String],
      default: []
    },
    missingKeywords: {
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
    recommendations: {
      type: [String],
      default: []
    },
    experienceMatch: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    educationMatch: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    projectsMatch: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    certificationMatch: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    overallFeedback: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Explicit Indexes
jobMatchSchema.index({ userId: 1 });
jobMatchSchema.index({ resumeId: 1 });
jobMatchSchema.index({ createdAt: -1 });

const JobMatch = mongoose.model('JobMatch', jobMatchSchema);

export default JobMatch;
