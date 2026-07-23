import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be null for guest requests (e.g. failed login actions)
  },
  action: {
    type: String,
    required: [true, 'Activity log action description is required.'],
    trim: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  browser: {
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
