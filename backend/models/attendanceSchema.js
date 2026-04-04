const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  sClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "staffModel",
  },
  staffModel: {
    type: String,
    enum: ["Teacher", "Staff"],
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Half Day"],
    required: true,
  },
  remark: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
