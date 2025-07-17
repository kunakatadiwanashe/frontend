import mongoose from "mongoose";

export async function connectToDB() {
  if (mongoose.connection.readyState >= 1) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const dbName = process.env.MONGODB_DB_NAME || "default-db-name";

  try {
    return await mongoose.connect(mongoUri, {
      dbName,
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
