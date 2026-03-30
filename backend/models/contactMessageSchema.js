const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Unread", "Read"],
    default: "Unread",
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
