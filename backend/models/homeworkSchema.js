const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema({
  sClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subject: {
    type: String, // Or ref if Subject schema exists
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model("Homework", homeworkSchema);
