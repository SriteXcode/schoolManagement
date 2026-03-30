const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "staffModel",
  },
  staffModel: {
    type: String,
    required: true,
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
