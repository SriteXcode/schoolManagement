const Exam = require("../models/examSchema");
const Notice = require("../models/noticeSchema");
const { validateSessionDate } = require("../middleware/sessionMiddleware");

exports.createExam = async (req, res) => {
  try {
    const { name, sClass, date, time, shift, subject, maxMarks, syllabus, type } = req.body;
    
    // Academic Session Validation
    try {
        await validateSessionDate(date);
    } catch (sessionError) {
        return res.status(400).json({ message: sessionError.message });
    }

    // Prevent scheduling in the past
    const examDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (examDate < today) {
        return res.status(400).json({ message: "Cannot schedule an exam in the past." });
    }

    // Check for duplicate exam name for the same subject in this class
    const existingSameSubject = await Exam.findOne({ name, sClass, subject });
    if (existingSameSubject) {
        return res.status(400).json({ message: `A test for ${subject} in ${name} already exists for this class.` });
    }

    // Check for time/date/shift conflict in this class
    const conflict = await Exam.findOne({ sClass, date, time, shift });
    if (conflict) {
        return res.status(400).json({ message: `Scheduling conflict: Another test (${conflict.subject} - ${conflict.name}) is already scheduled for this class at this time/shift.` });
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
      shift,
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
    const exams = await Exam.find({ sClass }).populate("sClass");
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllExams = async (req, res) => {
    try {
        const exams = await Exam.find()
            .populate("sClass")
            .populate("creator", "name")
            .sort({ date: -1 });
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkCreateExams = async (req, res) => {
    try {
        const { exams, sendNotification } = req.body; // exams is an array of exam objects
        
        if (!Array.isArray(exams) || exams.length === 0) {
            return res.status(400).json({ message: "No exams provided" });
        }

        // Prevent scheduling in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (const e of exams) {
            // Academic Session Validation
            try {
                await validateSessionDate(e.date);
            } catch (sessionError) {
                return res.status(400).json({ message: `Exam for ${e.subject}: ${sessionError.message}` });
            }

            if (new Date(e.date) < today) {
                return res.status(400).json({ message: `Cannot schedule exam for ${e.subject} on ${new Date(e.date).toLocaleDateString()} (Past date).` });
            }
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

        const examsToCreate = exams.map(e => ({
            ...e,
            creator: creatorId,
            creatorModel: creatorModel,
            type: e.type || "Main Exam"
        }));

        const createdExams = await Exam.insertMany(examsToCreate);

        if (sendNotification) {
            // Create a notice for the new exams
            const uniqueClasses = [...new Set(exams.map(e => e.sClass))];
            const examNames = [...new Set(exams.map(e => e.name))].join(", ");
            
            await Notice.create({
                title: `New Exams Scheduled: ${examNames}`,
                details: `New examinations have been scheduled for your class. Total ${exams.length} papers added. Please check your exam schedule.`,
                targetAudience: uniqueClasses.length === 1 ? 'Class' : 'Student',
                targetClass: uniqueClasses.length === 1 ? uniqueClasses[0] : null
            });
        }

        res.status(201).json({ 
            message: `Successfully created ${createdExams.length} exams`, 
            count: createdExams.length 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Exam deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const { name, sClass, date, time, shift, subject, maxMarks, syllabus, type } = req.body;

        // Academic Session Validation
        try {
            await validateSessionDate(date);
        } catch (sessionError) {
            return res.status(400).json({ message: sessionError.message });
        }

        const updatedExam = await Exam.findByIdAndUpdate(req.params.id, {
            name, sClass, date, time, shift, subject, maxMarks, syllabus, type
        }, { new: true });
        res.status(200).json({ message: "Exam updated successfully", exam: updatedExam });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
