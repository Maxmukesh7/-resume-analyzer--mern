import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Target User ID is required.']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required.'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification descriptive message is required.']
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Explicit Indexes
notificationSchema.index({ user: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
