const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL
  },
  date: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["Achievement", "WallOfFame"],
    default: "Achievement",
  },
}, { timestamps: true });

module.exports = mongoose.model("Achievement", achievementSchema);
