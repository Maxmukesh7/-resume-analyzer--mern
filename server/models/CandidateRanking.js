import mongoose from 'mongoose';

const candidateEvaluationSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  fileName: {
    type: String,
    default: ''
  },
  originalName: {
    type: String,
    default: ''
  },
  candidateName: {
    type: String,
    default: 'Candidate'
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  atsScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  jobMatchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  skillMatchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  experienceMatchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  educationMatchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  projectMatchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  certificationMatchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  overallScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  rank: {
    type: Number,
    default: 0
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
  parsedData: {
    type: Object,
    default: () => ({})
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  },
  error: {
    type: String,
    default: ''
  }
});

const candidateRankingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner recruiter user ID is required.']
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required.'],
      trim: true
    },
    companyName: {
      type: String,
      default: 'Target Company',
      trim: true
    },
    jobDescription: {
      type: String,
      required: [true, 'Job description text is required.']
    },
    weights: {
      atsWeight: { type: Number, default: 0.30 },
      jobMatchWeight: { type: Number, default: 0.40 },
      skillWeight: { type: Number, default: 0.15 },
      experienceWeight: { type: Number, default: 0.10 },
      educationWeight: { type: Number, default: 0.05 }
    },
    totalResumes: {
      type: Number,
      default: 0
    },
    processedCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    candidates: [candidateEvaluationSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

candidateRankingSchema.index({ userId: 1, createdAt: -1 });
candidateRankingSchema.index({ jobTitle: 'text', companyName: 'text' });

const CandidateRanking = mongoose.model('CandidateRanking', candidateRankingSchema);

export default CandidateRanking;
