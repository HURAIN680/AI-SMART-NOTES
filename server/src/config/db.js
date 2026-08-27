import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URL;

    // Check if the provided URL is a valid MongoDB connection string
    if (!mongoUri || (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://"))) {
      console.warn("⚠️ Invalid or missing MONGO_URL in .env. Falling back to local MongoDB: mongodb://127.0.0.1:27017/ai-smart-notes");
      mongoUri = "mongodb://127.0.0.1:27017/ai-smart-notes";
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Please check your MONGO_URL in server/.env. It must start with mongodb:// or mongodb+srv://");
    // Avoid crashing nodemon loop
  }
};


export default connectDB;