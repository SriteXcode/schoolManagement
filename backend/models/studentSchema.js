const mongoose = require("mongoose");
const validator = require("validator");

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rollNum: {
    type: String,
    required: true,
  },
  sClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  dob: {
    type: Date,
  },
  guardianName: {
    type: String,
  },
  guardianPhone: {
    type: String,
  },
  address: {
    type: String,
    default: "Not Provided"
  },
  bloodGroup: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
    default: "Unknown"
  },
  profileImage: {
    type: String,
    default: ""
  },
  remark: {
    type: String,
    default: ""
  },
  achievements: [{
    title: String,
    date: Date,
    description: String
  }],
  category: {
    type: String,
    enum: ['Regular', 'Defaulter', 'Disciplined', 'Best'],
    default: 'Regular'
  },
  reviews: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

studentSchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, curr) => acc + curr.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});

module.exports = mongoose.model("Student", studentSchema);
