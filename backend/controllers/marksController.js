const Marks = require("../models/marksSchema");
const Exam = require("../models/examSchema");

exports.addMarks = async (req, res) => {
  try {
    const { examId, marksData } = req.body; 
    
    // Check if exam exists and if its date is in the past
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const examDate = new Date(exam.date);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (examDate > today) {
        return res.status(400).json({ message: "Marks can only be entered after the examination date." });
    }

    // Validate marksData against maxMarks
    for (const record of marksData) {
        if (record.score > exam.maxMarks) {
            return res.status(400).json({ message: `Score for one or more students exceeds the maximum allowed marks (${exam.maxMarks}).` });
        }
    }

    const updates = marksData.map(async (record) => {
      const { student, subject, score } = record;
      return await Marks.findOneAndUpdate(
        { exam: examId, student, subject },
        { score },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updates);

    res.status(200).json({ message: "Marks added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMarks = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const marks = await Marks.find({ exam: examId, student: studentId }).populate("student", "name");
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMarksByExam = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const marks = await Marks.find({ exam: examId });
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentAllMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await Marks.find({ student: studentId }).populate("exam", "name date");
    res.status(200).json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
