const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  subjects: [{
    subName: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);
