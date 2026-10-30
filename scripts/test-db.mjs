import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing. Check .env.local");
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("CONNECTED to database:", mongoose.connection.name);
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", cols.map((c) => c.name));
  await mongoose.disconnect();
} catch (e) {
  console.error("FAILED:", e.message);
  process.exit(1);
}
