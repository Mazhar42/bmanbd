const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await connectDB();

    const email = "admin@bmanbd.com";
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`User ${email} already exists.`);
      process.exit(0);
    }

    await User.create({
      name: "Admin",
      email,
      password: "09007860",
      role: "admin",
    });

    console.log(`✅ Admin user created: ${email} / 09007860`);
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  }
};

createAdmin();
