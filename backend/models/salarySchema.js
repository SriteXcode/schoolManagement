const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
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
  bonuses: [{
    name: String,
    amount: Number,
  }],
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
