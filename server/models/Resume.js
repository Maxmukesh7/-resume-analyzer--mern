import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
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
    },
    status: {
      type: String,
      default: 'uploaded'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases for strict requirement matching
resumeSchema.virtual('userId').get(function () {
  return this.user;
});
resumeSchema.virtual('originalFileName').get(function () {
  return this.originalName;
});
resumeSchema.virtual('storedFileName').get(function () {
  return this.fileName;
});
resumeSchema.virtual('filePath').get(function () {
  return this.uploadPath;
});
resumeSchema.virtual('mimeType').get(function () {
  return this.fileType;
});

// Explicit Indexes
resumeSchema.index({ user: 1 });
resumeSchema.index({ uploadDate: -1 });

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
