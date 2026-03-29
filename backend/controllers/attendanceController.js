const mongoose = require("mongoose");
const Attendance = require("../models/attendanceSchema");
const Student = require("../models/studentSchema");
const Class = require("../models/classSchema");
const Teacher = require("../models/teacherSchema");

exports.markAttendance = async (req, res) => {
  try {
    const { date, attendanceData, sClass } = req.body; 
    
    // Validate Class Teacher Permission
    // We assume the middleware adds 'req.user'
    if (req.user.role === 'Teacher') {
        const teacher = await Teacher.findOne({ user: req.user._id });
        const targetClass = await Class.findById(sClass);
        
        if (!targetClass) {
            return res.status(404).json({ message: "Class not found" });
        }
        
        // Strict Check: Only the assigned Class Teacher can mark attendance
        if (targetClass.classTeacher.toString() !== teacher._id.toString()) {
            return res.status(403).json({ message: "Only the Class Teacher can mark attendance." });
        }
    }

    const updates = attendanceData.map(async (record) => {
      const { student, status } = record;
      return await Attendance.findOneAndUpdate(
        { student, date, sClass },
        { status },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updates);

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { sClass, date } = req.params;
    const attendance = await Attendance.find({ sClass, date }).populate("student", "name rollNum");
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendance = await Attendance.find({ student: studentId }).sort({ date: -1 });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClassAttendanceStats = async (req, res) => {
  try {
    const { sClass } = req.params;
    const stats = await Attendance.aggregate([
      { $match: { sClass: new mongoose.Types.ObjectId(sClass) } },
      {
        $group: {
          _id: "$student",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          }
        }
      }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
