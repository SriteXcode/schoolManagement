const Notice = require("../models/noticeSchema");
const Student = require("../models/studentSchema");
const Teacher = require("../models/teacherSchema");

exports.createNotice = async (req, res) => {
  try {
    const { title, details, date, targetAudience, targetClass } = req.body;
    const notice = await Notice.create({
      title,
      details,
      date: date || Date.now(),
      targetAudience,
      targetClass: targetAudience === 'Class' ? targetClass : null
    });
    res.status(201).json({ message: "Notice created successfully", notice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotices = async (req, res) => {
  try {
    let filter = { targetAudience: 'All' }; // Default for public

    if (req.user) {
        if (req.user.role === 'Admin') {
            filter = {}; // Admin sees all
        } else if (req.user.role === 'Student') {
            const student = await Student.findOne({ user: req.user._id });
            const conditions = [
                { targetAudience: 'All' },
                { targetAudience: 'Student' }
            ];
            if (student?.sClass) {
                conditions.push({ targetAudience: 'Class', targetClass: student.sClass });
            }
            filter = { $or: conditions };
        } else if (req.user.role === 'Teacher') {
            const teacher = await Teacher.findOne({ user: req.user._id });
            const conditions = [
                { targetAudience: 'All' },
                { targetAudience: 'Teacher' }
            ];
            if (teacher?.sClass) {
                conditions.push({ targetAudience: 'Class', targetClass: teacher.sClass });
            }
            filter = { $or: conditions };
        }
    }

    const notices = await Notice.find(filter).populate('targetClass', 'grade section').sort({ date: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
