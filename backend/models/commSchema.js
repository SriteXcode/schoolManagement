const mongoose = require("mongoose");

const commSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["Contact", "Problem", "Feedback"], // Contact (Public), Problem (User), Feedback (User)
    default: "Contact",
  },
  status: {
    type: String,
    enum: ["Pending", "Resolved"],
    default: "Pending",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The sender (Student)
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The target Teacher (or null for Admin)
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model("Communication", commSchema);
