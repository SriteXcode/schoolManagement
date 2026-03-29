const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  sClass: { // Class they are in charge of (Class Teacher)
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  schoolCell: {
    type: String,
    enum: ["None", "AdmissionCell", "ExamCell", "DisciplineCell", "SportsCell", "ManagementCell"],
    default: "None"
  },
  profileImage: {
    type: String,
    default: ""
  },
  remark: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Teacher", teacherSchema);
