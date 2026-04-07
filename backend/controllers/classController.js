const Class = require("../models/classSchema");
const Teacher = require("../models/teacherSchema");
const Student = require("../models/studentSchema");
const User = require("../models/userSchema");
const Timetable = require("../models/timetableSchema");

exports.getUnassignedStudents = async (req, res) => {
  try {
    const students = await Student.find({ sClass: null }).populate("user", "-password");
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reassignStudentToClass = async (req, res) => {
  try {
    const { studentId, classId } = req.body;
    
    const sClass = await Class.findById(classId);
    if (!sClass) return res.status(404).json({ message: "Target class not found" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Generate New Roll Number based on target class (Safe Generation)
    let nextNum = await Student.countDocuments({ sClass: classId }) + 1;
    let newRollNum, newEmail, userExists;

    do {
        newRollNum = `${sClass.grade}${sClass.section}${String(nextNum).padStart(3, '0')}`;
        newEmail = `${newRollNum}@school.com`.toLowerCase();
        userExists = await User.findOne({ email: newEmail });
        if (userExists) nextNum++;
    } while (userExists);

    // Update Student Profile
    student.sClass = classId;
    student.rollNum = newRollNum;
    await student.save();

    // Update Linked User Email
    await User.findByIdAndUpdate(student.user, { email: newEmail });

    res.status(200).json({ 
        message: "Student reassigned successfully", 
        student,
        newCredentials: { username: newEmail }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { grade, section, teacherId } = req.body;
    const existingClass = await Class.findOne({ grade, section });
    if (existingClass) {
      return res.status(400).json({ message: "Class already exists" });
    }

    if (teacherId) {
        const teacherAssigned = await Class.findOne({ classTeacher: teacherId });
        if (teacherAssigned) {
            return res.status(400).json({ 
                message: "This teacher is already assigned to another class as a class teacher." 
            });
        }
    }

    const sClass = await Class.create({ 
        grade, 
        section, 
        classTeacher: teacherId || null 
    });

    // If a teacher was assigned, update the Teacher record
    if (teacherId) {
        await Teacher.findByIdAndUpdate(teacherId, { sClass: sClass._id });
    }

    res.status(201).json({ message: "Class created successfully", sClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignTeacher = async (req, res) => {
  try {
    const { classId, teacherId } = req.body;
    
    // Case 1: Unassigning the teacher
    if (teacherId === "None" || !teacherId) {
        const sClass = await Class.findById(classId);
        if (sClass.classTeacher) {
            await Teacher.findByIdAndUpdate(sClass.classTeacher, { sClass: null });
        }
        await Class.findByIdAndUpdate(classId, { classTeacher: null });
        return res.status(200).json({ message: "Teacher unassigned successfully" });
    }

    // Case 2: Assigning/Changing the teacher
    
    // Check if the teacher is already a class teacher for another class
    const existingAssignment = await Class.findOne({ classTeacher: teacherId });
    if (existingAssignment && existingAssignment._id.toString() !== classId) {
        return res.status(400).json({ 
            message: "This teacher is already assigned to another class as a class teacher." 
        });
    }

    // Get the current class to see if there's already a teacher assigned
    const targetClass = await Class.findById(classId);
    
    // If there was a previous teacher, clear their sClass reference
    if (targetClass.classTeacher && targetClass.classTeacher.toString() !== teacherId) {
        await Teacher.findByIdAndUpdate(targetClass.classTeacher, { sClass: null });
    }
    
    // Assign teacher to the class
    const sClass = await Class.findByIdAndUpdate(classId, { classTeacher: teacherId }, { new: true });
    
    // Update the Teacher's record
    await Teacher.findByIdAndUpdate(teacherId, { sClass: classId });

    res.status(200).json({ message: "Teacher assigned successfully", sClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClasses = async (req, res) => {
  try {
    let query = {};
    
    // If user is a Teacher, only return classes where they are either Class Teacher or Subject Teacher
    if (req.user && req.user.role === "Teacher") {
        const teacher = await Teacher.findOne({ user: req.user._id });
        if (teacher) {
            query = {
                $or: [
                    { classTeacher: teacher._id },
                    { "subjects.teacher": teacher._id }
                ]
            };
        } else {
            return res.status(200).json([]);
        }
    }

    const classes = await Class.find(query)
      .populate("classTeacher", "name email")
      .populate("subjects.teacher", "name email");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClassDetails = async (req, res) => {
  try {
    const sClass = await Class.findById(req.params.id)
      .populate("classTeacher", "name email phone user")
      .populate("subjects.teacher", "name email phone user");
      
    if (!sClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json(sClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubjects = async (req, res) => {
  try {
    const { classId, subjects } = req.body;
    
    // Validate that subjects is an array
    if (!Array.isArray(subjects)) {
      return res.status(400).json({ message: "Subjects must be an array" });
    }

    const sClass = await Class.findByIdAndUpdate(
      classId, 
      { subjects }, 
      { new: true }
    ).populate("subjects.teacher", "name email phone user");

    if (!sClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Subjects updated successfully", subjects: sClass.subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const sClass = await Class.findById(id);
    if (!sClass) return res.status(404).json({ message: "Class not found" });

    // 1. Unassign Class Teacher
    if (sClass.classTeacher) {
        await Teacher.findByIdAndUpdate(sClass.classTeacher, { sClass: null });
    }

    // 2. Unassign Students
    await Student.updateMany({ sClass: id }, { sClass: null });

    // 3. Delete related Timetables
    await Timetable.deleteMany({ sClass: id });

    // 4. Delete the class itself
    await Class.findByIdAndDelete(id);

    res.status(200).json({ message: "Class and related records cleaned up successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
