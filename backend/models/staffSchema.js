const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  idNum: {
    type: String, // Employee ID
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["BusDriver", "LabAssistant", "CleaningStaff", "Other"],
    required: true,
  },
  department: {
    type: String,
  },
  salary: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
  },
  dateOfJoining: {
    type: Date,
    default: Date.now,
  },
  profileImage: {
    type: String,
    default: "",
  },
}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);
