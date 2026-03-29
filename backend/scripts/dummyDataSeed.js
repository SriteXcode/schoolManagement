const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/userSchema");
const Class = require("../models/classSchema");
const Teacher = require("../models/teacherSchema");
const Student = require("../models/studentSchema");

// Robust ENV loading
dotenv.config({ path: path.join(__dirname, "../.env") });

const subjectsConfig = {
  "LKG": ["English", "Mathematics", "Hindi", "Art & Craft", "EVS (Oral)", "Physical Education"],
  "UKG": ["English", "Mathematics", "Hindi", "Art & Craft", "EVS", "Physical Education"],
  "1": ["English", "Mathematics", "Hindi", "EVS", "Computer Science", "Art & Craft", "Physical Education"],
  "2": ["English", "Mathematics", "Hindi", "EVS", "Computer Science", "Art & Craft", "Physical Education"],
  "3": ["English", "Mathematics", "Hindi", "EVS", "Computer Science", "General Knowledge", "Art", "Physical Education"],
  "4": ["English", "Mathematics", "Hindi", "EVS", "Computer Science", "General Knowledge", "Art", "Physical Education"],
  "5": ["English", "Mathematics", "Hindi", "EVS", "Computer Science", "General Knowledge", "Art", "Physical Education"],
  "6": ["English", "Mathematics", "Hindi", "Science", "Social Science", "Sanskrit", "Computer Science", "Physical Education"],
  "7": ["English", "Mathematics", "Hindi", "Science", "Social Science", "Sanskrit", "Computer Science", "Physical Education"],
  "8": ["English", "Mathematics", "Hindi", "Science", "Social Science", "Sanskrit", "Computer Science", "Physical Education"],
  "9": ["English", "Mathematics", "Hindi", "Science", "Social Science", "Computer Applications", "Physical Education"],
  "10": ["English", "Mathematics", "Hindi", "Science", "Social Science", "Computer Applications", "Physical Education"]
};

const teacherSpecialties = [
  "English", "Mathematics", "Hindi", "EVS", "Science", "Social Science", 
  "Sanskrit", "Computer Science", "Computer Applications", "General Knowledge", 
  "Art & Craft", "Art", "Physical Education"
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/school_management";
    console.log(`Connecting to DB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected! Clearing non-admin users and school data...");

    // Clear existing data (Keep Admins)
    await User.deleteMany({ role: { $ne: "Admin" } });
    await Class.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    
    console.log("Creating Teachers Pool...");
    const teacherPool = {};

    for (const subject of teacherSpecialties) {
        teacherPool[subject] = [];
        for (let i = 1; i <= 2; i++) {
            const email = `teacher_${subject.toLowerCase().replace(/\s+/g, '_')}_${i}@school.com`;
            
            const user = await User.create({
                name: `${subject} Teacher ${i}`,
                email: email,
                password: "123456",
                phone: "987654321" + i,
                role: "Teacher",
                status: "Approved"
            });

            const teacherProfile = await Teacher.create({
                user: user._id,
                name: user.name,
                email: user.email,
                qualification: `M.Ed in ${subject}`,
                gender: i % 2 === 0 ? "Male" : "Female"
            });
            
            teacherPool[subject].push(teacherProfile);
        }
    }

    console.log("Creating Classes & Students...");
    const grades = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const studentLog = [];

    for (const grade of grades) {
        for (const section of ["A", "B"]) {
            const subList = subjectsConfig[grade];
            const classSubjects = [];
            let assignedTeachers = [];

            subList.forEach((subName, index) => {
                const pool = teacherPool[subName] || teacherPool["Art"];
                const teacher = pool[index % pool.length];
                classSubjects.push({ subName: subName, teacher: teacher._id });
                assignedTeachers.push(teacher);
            });

            const classTeacher = assignedTeachers[0];

            const sClass = await Class.create({
                grade,
                section,
                classTeacher: classTeacher._id,
                subjects: classSubjects
            });

            await Teacher.findByIdAndUpdate(classTeacher._id, { sClass: sClass._id });

            for (let i = 1; i <= 3; i++) {
                const rollNum = `${grade}${section}${String(i).padStart(3, '0')}`;
                const email = `${rollNum.toLowerCase()}@school.com`;
                
                const user = await User.create({
                    name: `Student ${i} (${grade}-${section})`,
                    email: email,
                    password: "123456",
                    phone: "123456789" + i,
                    role: "Student",
                    status: "Approved"
                });

                await Student.create({
                    user: user._id,
                    name: user.name,
                    rollNum: rollNum,
                    sClass: sClass._id,
                    gender: i % 2 === 0 ? "Female" : "Male",
                    guardianName: "Parent of " + i,
                    address: "Street " + i + ", School District"
                });

                if (studentLog.length < 5) {
                    studentLog.push({ email, password: "123456" });
                }
            }
        }
    }

    console.log("\nSeed Complete! 🏫");
    console.log("Admin: admin@school.com / adminpassword123");
    console.log("Sample Students for Login:");
    studentLog.forEach(s => console.log(`  - ${s.email} / ${s.password}`));
    
    process.exit();
  } catch (error) {
    console.error("Critical Seed Error:", error);
    process.exit(1);
  }
};

seedData();
