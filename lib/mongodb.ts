import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lost-found-system';
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  // If we're already connected, return the existing connection
  if (cachedConnection) {
    return cachedConnection;
  }

  // Check if we're in a test or mock environment where we should return a mock connection
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_DB === 'true') {
    console.log('Using mock MongoDB connection');
    return mongoose;
  }

  try {
    // For local development without MongoDB, provide mock functionality
    if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/lost-found-system') {
      console.warn('No MongoDB URI provided or using default local URI. Some functionality may be limited.');
      
      // If mongoose is not connected and we're in development, we'll proceed but with warnings
      if (process.env.NODE_ENV === 'development') {
        cachedConnection = mongoose;
        return mongoose;
      }
    }
    
    const connection = await mongoose.connect(MONGODB_URI);
    
    cachedConnection = connection;
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // In development, allow the app to continue even if DB connection fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Running with limited functionality due to MongoDB connection failure.');
      cachedConnection = mongoose;
      return mongoose;
    }
    
    throw error;
  }
}

export default connectToDatabase; 