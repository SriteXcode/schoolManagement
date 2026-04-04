const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['Holiday', 'Event', 'Exam', 'Meeting', 'Celebration'],
    default: 'Event'
  },
  instructions: {
    type: String, // Special instructions for celebrations etc.
  },
  time: {
    type: String,
    default: 'Full Day'
  }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
