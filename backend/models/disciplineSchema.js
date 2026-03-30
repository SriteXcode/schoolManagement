const mongoose = require("mongoose");

const disciplineSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  incidentType: {
    type: String,
    enum: ["Misconduct", "Bullying", "Truancy", "Academic Dishonesty", "Other"],
    required: true,
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },
  description: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  actionTaken: {
    type: String,
    default: "Under Review",
  },
  teacherComment: {
    type: String,
    default: "",
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["Open", "Resolved", "Dismissed"],
    default: "Open",
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("Discipline", disciplineSchema);
