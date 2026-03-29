const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema({
  sClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  academicYear: {
    type: String,
    default: "2023-2024"
  },
  description: {
    type: String,
    default: "Standard subject curriculum for the academic year."
  },
  chapters: [{
    chapterNo: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    estimatedDays: { type: Number, default: 5 },
    plannedDate: { type: Date },
    completionDate: { type: Date },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    },
    topics: [{
      title: { type: String, required: true },
      status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
      },
      completionDate: { type: Date }
    }],
    resources: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      type: {
        type: String,
        enum: ['Video', 'PDF', 'Link', 'Document', 'Image'],
        default: 'Link'
      }
    }]
  }],
  totalProgress: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Syllabus", syllabusSchema);
