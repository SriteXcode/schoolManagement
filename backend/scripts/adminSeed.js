const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/userSchema");
const dbConnection = require("../database/dbConnection");

dotenv.config({ path: "../.env" }); // Adjust path to reach root .env if running from scripts dir

const registerAdmin = async () => {
  try {
    // If running from root, path might be slightly different for .env
    // We assume running from root: node backend/scripts/adminSeed.js
    // So .env is in backend/.env, wait.
    // Let's rely on standard dotenv config if we run `node scripts/adminSeed.js` inside backend.
    
    // Connect to DB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/school_management");
    
    const adminEmail = "admin@school.com";
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      console.log("Admin already exists");
      process.exit();
    }
    
    const admin = await User.create({
      name: "Super Admin",
      email: adminEmail,
      phone: "1234567890",
      password: "adminpassword123", // Change this in production
      role: "Admin",
    });
    
    console.log("Admin registered successfully");
    console.log("Email: " + adminEmail);
    console.log("Password: adminpassword123");
    
    process.exit();
  } catch (error) {
    console.error("Error registering admin:", error);
    process.exit(1);
  }
};

registerAdmin();
