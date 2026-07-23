import mongoose from 'mongoose';

const jobDescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User owner reference is required.']
  },
  title: {
    type: String,
    required: [true, 'Job title is required.'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required.'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Job description text body is required.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Explicit Indexes
jobDescriptionSchema.index({ user: 1 });
jobDescriptionSchema.index({ createdAt: -1 });

const JobDescription = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescription;
