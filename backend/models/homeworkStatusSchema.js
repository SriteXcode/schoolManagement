const mongoose = require("mongoose");

const homeworkStatusSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  homework: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Homework",
    required: true,
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started",
  },
}, { timestamps: true });

// Ensure a student can only have one status per homework
homeworkStatusSchema.index({ student: 1, homework: 1 }, { unique: true });

module.exports = mongoose.model("HomeworkStatus", homeworkStatusSchema);
