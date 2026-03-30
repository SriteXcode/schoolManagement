const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: {
    type: String, // e.g., "Midterm 2026"
    required: true,
  },
  sClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subject: {
    type: String,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, // e.g., "09:00 AM - 12:00 PM"
    default: "09:00 AM"
  },
  shift: {
    type: String, // e.g., "Morning", "Evening", "Shift 1"
    default: "Morning"
  },
  type: {
    type: String,
    enum: ["Main Exam", "Class Test"],
    default: "Main Exam",
  },
  syllabus: {
    type: String,
    required: [true, "Syllabus is compulsory for every test"],
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "creatorModel", // Can be either User or Teacher? Better stick to User ID.
  },
  creatorModel: {
    type: String,
    enum: ["User", "Teacher"],
    default: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);
