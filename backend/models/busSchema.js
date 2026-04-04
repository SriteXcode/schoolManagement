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
  stops: [
    {
      stopName: { type: String, required: true },
      fee: { type: Number, required: true },
    }
  ],
  status: {
    type: String,
    enum: ["Active", "Maintenance", "Inactive"],
    default: "Active",
  },
}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);
