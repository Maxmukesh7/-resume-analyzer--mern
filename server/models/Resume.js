import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner User ID is required.']
  },
  fileName: {
    type: String,
    required: [true, 'Unique file name is required.']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required.']
  },
  fileType: {
    type: String,
    required: [true, 'File type (mimetype) is required.']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size in bytes is required.']
  },
  uploadPath: {
    type: String,
    required: [true, 'Relative upload storage path is required.']
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

// Explicit Indexes
resumeSchema.index({ user: 1 });
resumeSchema.index({ uploadDate: -1 });

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
