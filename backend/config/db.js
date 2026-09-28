import mongoose from "mongoose";

const db = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/LearniX";
    const conn = await mongoose.connect(mongoUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    try {
      console.log("Attempting fallback to local MongoDB at mongodb://127.0.0.1:27017/LearniX...");
      const conn = await mongoose.connect("mongodb://127.0.0.1:27017/LearniX");
      console.log(`MongoDB Connected (Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Fallback connection error: ${fallbackError.message}`);
    }
  }
};

export default db;
