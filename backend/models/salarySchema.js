const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "staffModel",
  },
  staffModel: {
    type: String,
    required: true,
    enum: ["Teacher", "Staff"],
  },
  month: {
    type: String,
    enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  baseSalary: {
    type: Number,
    required: true,
  },
  bonus: {
    type: Number,
    default: 0,
  },
  increment: {
    type: Number,
    default: 0,
  },
  hike: {
    type: Number,
    default: 0,
  },
  deductions: [{
    name: String,
    amount: Number,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Paid", "Pending"],
    default: "Pending",
  },
  paymentDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Cheque"],
  },
}, { timestamps: true });

module.exports = mongoose.model("Salary", salarySchema);
