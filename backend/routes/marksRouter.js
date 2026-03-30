const express = require("express");
const router = express.Router();
const { addMarks, getMarks, getMarksByExam, getStudentAllMarks } = require("../controllers/marksController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

router.post("/add", auth, authorizeRole(...teacherRoles), addMarks);
router.get("/student/:studentId", auth, getStudentAllMarks);
router.get("/exam/:examId", auth, authorizeRole(...teacherRoles), getMarksByExam);
router.get("/:examId/:studentId", auth, getMarks);

module.exports = router;
