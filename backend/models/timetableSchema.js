const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
  sClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  phase: { type: mongoose.Schema.Types.ObjectId, ref: "SchedulePhase", required: true },
  day: { 
    type: String, 
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], 
    required: true 
  },
  slots: [
    {
      slotIndex: { type: Number, required: true }, // Index in phase.slots
      subject: { type: String },
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }
    }
  ]
}, { timestamps: true });

// Complex validation for teacher overlap will be handled in the controller
// to allow for better error messages.

module.exports = mongoose.model("Timetable", timetableSchema);
