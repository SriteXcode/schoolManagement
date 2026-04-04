const Homework = require("../models/homeworkSchema");
const HomeworkStatus = require("../models/homeworkStatusSchema");
const Student = require("../models/studentSchema");
const { validateSessionDate } = require("../middleware/sessionMiddleware");

exports.createHomework = async (req, res) => {
  try {
    const { sClass, subject, title, description, dueDate } = req.body;
    
    // Academic Session Validation
    try {
        await validateSessionDate(dueDate);
    } catch (sessionError) {
        return res.status(400).json({ message: sessionError.message });
    }

    // Default dueDate: Next day if not provided
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 1);
    
    const homework = await Homework.create({
      sClass,
      subject,
      title,
      description,
      dueDate: dueDate || defaultDueDate,
    });

    res.status(201).json({ message: "Homework created successfully", homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getHomework = async (req, res) => {
  try {
    const { sClass } = req.params;
    const homework = await Homework.find({ sClass }).sort({ date: -1 });

    // If student, attach their personal status for each homework
    if (req.user.role === 'Student') {
        const student = await Student.findOne({ user: req.user._id });
        if (student) {
            const statuses = await HomeworkStatus.find({ student: student._id });
            const statusMap = {};
            statuses.forEach(s => statusMap[s.homework.toString()] = s.status);
            
            const homeworkWithStatus = homework.map(hw => {
                const hwObj = hw.toObject();
                hwObj.myStatus = statusMap[hw._id.toString()] || "Not Started";
                return hwObj;
            });
            return res.status(200).json(homeworkWithStatus);
        }
    }

    res.status(200).json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateHomeworkStatus = async (req, res) => {
    try {
        const { homeworkId, status } = req.body;
        const student = await Student.findOne({ user: req.user._id });
        
        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        const updatedStatus = await HomeworkStatus.findOneAndUpdate(
            { student: student._id, homework: homeworkId },
            { status },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Status updated", status: updatedStatus.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateHomework = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, title, description, dueDate } = req.body;
        
        // Academic Session Validation
        try {
            await validateSessionDate(dueDate);
        } catch (sessionError) {
            return res.status(400).json({ message: sessionError.message });
        }

        const updatedHomework = await Homework.findByIdAndUpdate(
            id,
            { subject, title, description, dueDate },
            { new: true }
        );

        if (!updatedHomework) {
            return res.status(404).json({ message: "Homework not found" });
        }

        res.status(200).json({ message: "Homework updated successfully", homework: updatedHomework });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
