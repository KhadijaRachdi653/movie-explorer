import mongoose from "mongoose";
import bcrypt from "bcryptjs";
await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.db.collection("users");
const hash = await bcrypt.hash("Test@123", 12);
const now = new Date();
for (const [name, email] of [["Test One","test1@test.com"],["Test Two","test2@test.com"]]) {
  await users.updateOne(
    { email },
    { $set: { name, password: hash, role: "user", updatedAt: now }, $setOnInsert: { createdAt: now, __v: 0 } },
    { upsert: true }
  );
  console.log("Ready:", email);
}
await mongoose.disconnect();
