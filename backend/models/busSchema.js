const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
  },
  route: {
    type: String,
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
  },
  capacity: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["Active", "Maintenance", "Inactive"],
    default: "Active",
  },
}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);
