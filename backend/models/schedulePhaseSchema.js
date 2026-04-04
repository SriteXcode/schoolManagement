const mongoose = require("mongoose");

const schedulePhaseSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., Summer, Winter
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reportingTime: { type: String, required: true }, // e.g., 07:30 (Prayer/Reporting)
  leavingTime: { type: String, required: true },   // e.g., 14:00 (Dismissal)
  slots: [
    {
      label: { type: String, required: true }, // e.g., Period 1, Period 2, Lunch
      startTime: { type: String, required: true }, // HH:mm
      endTime: { type: String, required: true }, // HH:mm
      type: { type: String, enum: ["Period", "Lunch"], default: "Period" }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("SchedulePhase", schedulePhaseSchema);
