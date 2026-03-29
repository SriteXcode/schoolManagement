const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  targetAudience: {
    type: String,
    enum: ['All', 'Student', 'Teacher', 'Class'],
    default: 'All'
  },
  targetClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  }
}, { timestamps: true });

module.exports = mongoose.model("Notice", noticeSchema);
