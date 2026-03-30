const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  images: [{
    type: String, // URLs
  }],
  category: {
    type: String,
    enum: ["Event", "Celebration", "Activity", "Other"],
    default: "Event",
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("Gallery", gallerySchema);
