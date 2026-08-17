import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  action: {
    type: String,
    required: [true, 'Activity log action description is required.'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  device: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Explicit Indexes
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
