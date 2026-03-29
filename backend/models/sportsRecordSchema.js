const mongoose = require("mongoose");

const sportsRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  sport: {
    type: String,
    required: true,
  },
  role: {
    type: String, // e.g., Captain, Player
  },
  achievements: [{
    title: String,
    date: Date,
    description: String,
  }],
  team: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("SportsRecord", sportsRecordSchema);
