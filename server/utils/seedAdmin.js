import User from '../models/User.js';

/**
 * Ensures at least one Admin account exists in the database.
 */
export const seedInitialAdmin = async () => {
  try {
    const defaultAdmin = await User.findOne({ email: 'admin@resumeanalyzer.com' });
    if (!defaultAdmin) {
      console.log('👑 [SEED] Creating default initial Administrator user...');
      const admin = new User({
        fullName: 'System Administrator',
        email: 'admin@resumeanalyzer.com',
        password: 'Admin@123456',
        role: 'admin',
        isActive: true,
        isVerified: true
      });
      await admin.save();
      console.log('✅ [SEED] Default Admin created: admin@resumeanalyzer.com / Admin@123456');
    }
  } catch (error) {
    console.error('⚠️ [SEED] Error creating initial admin:', error.message);
  }
};

export default seedInitialAdmin;
