const express = require("express");
const router = express.Router();
const { markAttendance, getAttendance, getStudentAttendance, getClassAttendanceStats } = require("../controllers/attendanceController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

router.post("/mark", auth, authorizeRole(...teacherRoles), markAttendance);
router.get("/stats/:sClass", auth, getClassAttendanceStats);
router.get("/student/:studentId", auth, getStudentAttendance);
router.get("/:sClass/:date", auth, getAttendance); 

module.exports = router;
