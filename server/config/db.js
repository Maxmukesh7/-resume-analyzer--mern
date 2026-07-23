import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using environment URIs.
 */
const connectDB = async () => {
  // Ensure connection is initialized only once
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!uri) {
    console.error('💥 Database connection error: MONGO_URI or MONGODB_URI environment variables are not defined.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    console.log(`📌 MongoDB Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`💥 Database Connection Error: ${error.message}`);
    throw error;
  }
};

/**
 * Closes the Mongoose connection gracefully.
 */
const gracefulShutdown = async (signal) => {
  try {
    await mongoose.connection.close();
    console.log(`\nMongoose connection closed gracefully due to process termination (${signal}).`);
    process.exit(0);
  } catch (error) {
    console.error(`Error closing Mongoose connection: ${error.message}`);
    process.exit(1);
  }
};

// Hook process termination signals to close DB connection gracefully
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default connectDB;
export { gracefulShutdown };
