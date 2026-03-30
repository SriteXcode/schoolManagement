const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  phone: {
    type: String,
    required: [true, "Please provide a phone number"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ["Admin", "Teacher", "Student", "AdmissionCell", "ExamCell", "DisciplineCell", "SportsCell", "ManagementCell", "BusDriver", "LabAssistant", "CleaningStaff"],
    default: "Student",
  },
  profileImage: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // Default avatar
  },
  status: {
    type: String,
    enum: ["Approved", "Pending", "Rejected"],
    default: "Approved",
  },
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "1d", // Short expiration for security, can be adjustable
  });
};

module.exports = mongoose.model("User", userSchema);
