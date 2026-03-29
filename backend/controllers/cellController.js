const Teacher = require("../models/teacherSchema");
const User = require("../models/userSchema");
const Discipline = require("../models/disciplineSchema");
const SportsRecord = require("../models/sportsRecordSchema");

// Assign Teacher to a Cell (Admin Only)
exports.assignTeacherToCell = async (req, res) => {
  try {
    const { teacherId, cell } = req.body; // cell: "AdmissionCell", "ExamCell", etc.

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    teacher.schoolCell = cell;
    await teacher.save();

    res.status(200).json({ message: `Teacher assigned to ${cell} successfully`, teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Discipline Cell ---
exports.reportIncident = async (req, res) => {
    try {
        const incident = await Discipline.create({
            ...req.body,
            reportedBy: req.user._id
        });
        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllIncidents = async (req, res) => {
    try {
        const incidents = await Discipline.find().populate("student reportedBy");
        res.status(200).json(incidents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Sports Cell ---
exports.addSportsRecord = async (req, res) => {
    try {
        const record = await SportsRecord.create(req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSportsRecords = async (req, res) => {
    try {
        const records = await SportsRecord.find().populate("student");
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
