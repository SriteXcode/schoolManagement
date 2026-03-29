const User = require("../models/userSchema");
const Teacher = require("../models/teacherSchema");

exports.registerTeacher = async (req, res) => {
  try {
    const { email, password, name, qualification, age, gender } = req.body;
    
    // 1. Create User
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: "Teacher",
      status: "Approved"
    });

    // 2. Create Teacher Profile
    const teacher = await Teacher.create({
      user: user._id,
      name,
      email,
      qualification,
      age,
      gender,
    });

    res.status(201).json({ message: "Teacher registered successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate("user", "-password"); // Exclude password
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, qualification, age, schoolCell, profileImage, remark } = req.body;
    
    const teacher = await Teacher.findById(id);
    if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
    }

    // Permission Check: Admin or the teacher themselves
    if (req.user.role !== "Admin" && req.user._id.toString() !== teacher.user.toString()) {
        return res.status(403).json({ message: "You are not authorized to update this profile" });
    }

    // Update Teacher Fields
    if (qualification) teacher.qualification = qualification;
    if (age) teacher.age = age;
    if (profileImage) teacher.profileImage = profileImage;
    if (remark !== undefined) teacher.remark = remark;
    if (req.user.role === "Admin" && schoolCell) teacher.schoolCell = schoolCell;
    
    await teacher.save();

    // Update Linked User Fields (Email/Phone/Name)
    const user = await User.findById(teacher.user);
    if (user) {
        if (email) user.email = email;
        if (name) user.name = name; // Sync name
        if (phone) user.phone = phone;
        await user.save();
    }

    res.status(200).json({ message: "Teacher updated successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const Class = require("../models/classSchema");

    // Find all classes where this teacher is either the class teacher or a subject teacher
    const classes = await Class.find({
        $or: [
            { classTeacher: id },
            { "subjects.teacher": id }
        ]
    }).select("grade section classTeacher subjects");

    const assignments = {
        classTeacherOf: [],
        subjectTeacherOf: []
    };

    classes.forEach(cls => {
        if (cls.classTeacher && cls.classTeacher.toString() === id) {
            assignments.classTeacherOf.push({
                grade: cls.grade,
                section: cls.section,
                classId: cls._id
            });
        }

        const subjects = cls.subjects.filter(s => s.teacher && s.teacher.toString() === id);
        subjects.forEach(s => {
            assignments.subjectTeacherOf.push({
                grade: cls.grade,
                section: cls.section,
                subjectName: s.subName,
                classId: cls._id
            });
        });
    });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id }).populate("sClass");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
