import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Enter a valid email address.']
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authenticationProvider === 'local' || (!this.authenticationProvider && !this.googleId);
        },
        'Password is required.'
      ],
      minlength: [8, 'Password must be at least 8 characters.']
    },
    avatar: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'recruiter'],
        message: '{VALUE} is not a supported role.'
      },
      default: 'user'
    },
    authenticationProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    googleId: {
      type: String,
      sparse: true,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to hash password before storing in MongoDB
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) {
    next();
    return;
  }
  try {
    console.log('🔒 [DEBUG] Hashing password using bcrypt...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('🔒 [DEBUG] Password successfully hashed.');
    next();
  } catch (error) {
    console.error('💥 [DEBUG] bcrypt error during save pre-hook:', error);
    next(error);
  }
});

// Compare password instance method
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
