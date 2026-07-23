import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Associated Resume ID is required.']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Associated User ID is required.']
    },
    summary: {
      type: String,
      required: [true, 'Professional resume summary is required.']
    },
    strengths: {
      type: [String],
      default: []
    },
    weaknesses: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [String],
      default: []
    },
    recommendations: {
      type: [String],
      default: []
    },
    careerSuggestions: {
      type: [String],
      default: []
    },
    priorityActions: {
      type: [String],
      default: []
    },
    grammarSuggestions: {
      type: [String],
      default: []
    },
    formattingSuggestions: {
      type: [String],
      default: []
    },
    recruiterFeedback: {
      type: [String],
      default: []
    },
    rating: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Needs Improvement'],
      default: 'Good'
    }
  },
  {
    timestamps: true
  }
);

// Explicit Indexes
aiAnalysisSchema.index({ resumeId: 1 });
aiAnalysisSchema.index({ userId: 1 });
aiAnalysisSchema.index({ createdAt: -1 });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);

export default AIAnalysis;
