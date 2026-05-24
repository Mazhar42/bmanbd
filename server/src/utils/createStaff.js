const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const createStaff = async () => {
  try {
    await connectDB();

    const email = "staff@bmanbd.com";
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`User ${email} already exists.`);
      process.exit(0);
    }

    await User.create({
      name: "Staff Member",
      email: email,
      password: "password123",
      role: "staff",
    });

    console.log(`✅ Staff user created: ${email} / password123`);
    process.exit(0);
  } catch (err) {
    console.error("Error creating staff user:", err);
    process.exit(1);
  }
};

createStaff();
