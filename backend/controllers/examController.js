const Exam = require("../models/examSchema");

exports.createExam = async (req, res) => {
  try {
    const { name, sClass, date, time, subject, maxMarks, syllabus, type } = req.body;
    
    // Check for duplicate exam name for the same subject in this class
    const existingSameSubject = await Exam.findOne({ name, sClass, subject });
    if (existingSameSubject) {
        return res.status(400).json({ message: `A test for ${subject} in ${name} already exists for this class.` });
    }

    // Check for time/date conflict in this class
    const conflict = await Exam.findOne({ sClass, date, time });
    if (conflict) {
        return res.status(400).json({ message: `Scheduling conflict: Another test (${conflict.subject} - ${conflict.name}) is already scheduled for this class at this time.` });
    }

    // Resolve Creator
    let creatorModel = "User";
    let creatorId = req.user._id;

    if (req.user.role === "Teacher" || req.user.role.endsWith('Cell')) {
        const Teacher = require("../models/teacherSchema");
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (teacher) {
            creatorModel = "Teacher";
            creatorId = teacher._id;
        }
    }

    const exam = await Exam.create({
      name,
      sClass,
      date,
      time,
      subject,
      maxMarks,
      syllabus,
      type: type || (req.user.role === "Admin" ? "Main Exam" : "Class Test"),
      creator: creatorId,
      creatorModel: creatorModel
    });
    res.status(201).json({ message: "Exam created successfully", exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getExams = async (req, res) => {
  try {
    const { sClass } = req.params;
    const exams = await Exam.find({ sClass });
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
