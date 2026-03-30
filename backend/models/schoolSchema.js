const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  establishedYear: {
    type: Number,
  },
  logo: {
    type: String, // URL to image
  },
  sessionStart: {
    type: Date,
  },
  sessionEnd: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model("School", schoolSchema);
