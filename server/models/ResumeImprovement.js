import mongoose from 'mongoose';

const recommendedSkillsSchema = new mongoose.Schema(
  {
    technicalSkills: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },
    frameworks: { type: [String], default: [] },
    cloudTechnologies: { type: [String], default: [] },
    devOpsTools: { type: [String], default: [] }
  },
  { _id: false }
);

const improvedProjectSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    bulletPoints: { type: [String], default: [] },
    technologies: { type: [String], default: [] }
  },
  { _id: false }
);

const improvedExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    description: { type: String, default: '' },
    bulletPoints: { type: [String], default: [] },
    period: { type: String, default: '' }
  },
  { _id: false }
);

const resumeImprovementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.']
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'Resume ID is required.']
    },
    originalResume: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    improvedResume: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    improvedSummary: {
      type: String,
      default: ''
    },
    improvedProjects: {
      type: [improvedProjectSchema],
      default: []
    },
    improvedExperience: {
      type: [improvedExperienceSchema],
      default: []
    },
    recommendedSkills: {
      type: recommendedSkillsSchema,
      default: () => ({})
    },
    optimizationNotes: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

resumeImprovementSchema.index({ resumeId: 1, userId: 1 });
resumeImprovementSchema.index({ createdAt: -1 });

const ResumeImprovement = mongoose.model('ResumeImprovement', resumeImprovementSchema);

export default ResumeImprovement;
