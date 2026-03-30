const User = require("../models/userSchema");
const Student = require("../models/studentSchema");
const Class = require("../models/classSchema");
const Fee = require("../models/feeSchema");

exports.registerStudent = async (req, res) => {
  try {
    const { name, classId, gender, guardianName, phone, transportMode, bus } = req.body;

    if (!classId || !name || !phone) {
        return res.status(400).json({ message: "Name, Class, and Phone are required." });
    }

    const sClass = await Class.findById(classId);
    if (!sClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 1. Auto-generate Roll Number
    // Format: [Grade][Section][00X] (e.g., 10A005)
    const studentCount = await Student.countDocuments({ sClass: classId });
    const rollNum = `${sClass.grade}${sClass.section}${String(studentCount + 1).padStart(3, '0')}`;

    // 2. Auto-generate Email (Username)
    const email = `${rollNum}@school.com`.toLowerCase();

    // 3. Password is Phone Number
    const password = phone;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Student ID already generated. Please try again." });
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "Student",
      status: "Approved"
    });

    // Create Student Profile
    const student = await Student.create({
      user: user._id,
      name,
      rollNum,
      sClass: classId,
      gender,
      guardianName,
      transportMode: transportMode || "By Foot",
      bus: transportMode === "Bus" ? bus : null
    });

    // Initial Fee Record
    await Fee.create({
        student: student._id,
        totalAmount: 50000, 
    });

    res.status(201).json({ 
        message: "Student registered successfully", 
        student,
        credentials: { username: email, password: password } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("user", "-password").populate("sClass").populate("bus");
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const { id } = req.params;
    const students = await Student.find({ sClass: id })
      .populate("user", "-password")
      .populate("bus")
      .populate("reviews.reviewer", "name role");
    
    // Fetch fee records to check for defaulters
    const studentIds = students.map(s => s._id);
    const fees = await Fee.find({ student: { $in: studentIds } }, 'student isDefaulter');

    // Create a map for quick lookup
    const feeMap = {};
    fees.forEach(f => feeMap[f.student.toString()] = f.isDefaulter);

    // Attach fee status to each student
    const studentsWithFeeStatus = students.map(s => {
        const studentObj = s.toObject();
        studentObj.isDefaulter = feeMap[s._id.toString()] || false;
        return studentObj;
    });

    res.status(200).json(studentsWithFeeStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStudentReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const staffRoles = ["Admin", "Teacher", "AdmissionCell", "ExamCell", "DisciplineCell", "SportsCell", "ManagementCell"];
    if (!staffRoles.includes(req.user.role)) {
         return res.status(403).json({ message: "Only teachers or staff can add reviews" });
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { 
        $push: { 
          reviews: {
            reviewer: req.user._id,
            rating,
            comment,
            date: new Date()
          } 
        } 
      },
      { new: true }
    ).populate("reviews.reviewer", "name role");

    res.status(200).json({ message: "Review added successfully", student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
        .populate("sClass")
        .populate("bus")
        .populate("reviews.reviewer", "name role");
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params; // Student ID (from Student collection)
    const { name, rollNum, gender, guardianName, email, phone, classId, category, address, achievements, bloodGroup, profileImage, remark, transportMode, bus } = req.body;

    const student = await Student.findById(id);
    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    // Permission Check: Admin, Teacher, AdmissionCell, or the student themselves
    const authorizedRoles = ["Admin", "Teacher", "AdmissionCell"];
    if (!authorizedRoles.includes(req.user.role) && req.user._id.toString() !== student.user.toString()) {
        return res.status(403).json({ message: "You are not authorized to update this profile" });
    }

    // Update Student Fields
    if (name) student.name = name;
    if (rollNum) student.rollNum = rollNum;
    if (gender) student.gender = gender;
    if (guardianName) student.guardianName = guardianName;
    if (classId) student.sClass = classId;
    if (category) student.category = category;
    if (address) student.address = address;
    if (achievements) student.achievements = achievements;
    if (bloodGroup) student.bloodGroup = bloodGroup;
    if (profileImage) student.profileImage = profileImage;
    if (remark !== undefined) student.remark = remark;
    if (transportMode) student.transportMode = transportMode;
    if (transportMode === "Bus") {
        if (bus) student.bus = bus;
    } else if (transportMode) {
        student.bus = null;
    }
    
    await student.save();

    // Update Linked User Fields (Email/Phone/Name)
    const user = await User.findById(student.user);
    if (user) {
        if (email) user.email = email;
        if (name) user.name = name; // Sync name
        if (phone) user.phone = phone;
        await user.save();
    }

    res.status(200).json({ message: "Student updated successfully", student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
