import mongoose from "mongoose";

let cachedPromise = null;

const db = async () => {
  // If already connected, return existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    "mongodb://127.0.0.1:27017/LearniX";

  const isLocal = mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost");

  try {
    cachedPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: isLocal ? 3000 : 8000,
      connectTimeoutMS: isLocal ? 3000 : 8000,
    });

    const conn = await cachedPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedPromise = null;
    console.error(`Error connecting to MongoDB (${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}): ${error.message}`);
    
    // In local dev only, try localhost fallback
    if (!isLocal && !process.env.VERCEL) {
      try {
        console.log("Attempting fallback to local MongoDB at mongodb://127.0.0.1:27017/LearniX...");
        const fallbackConn = await mongoose.connect("mongodb://127.0.0.1:27017/LearniX", {
          serverSelectionTimeoutMS: 2000,
        });
        console.log(`MongoDB Connected (Fallback): ${fallbackConn.connection.host}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`Fallback connection error: ${fallbackError.message}`);
      }
    }
  }
};

export default db;
