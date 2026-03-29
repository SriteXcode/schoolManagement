const express = require("express");
const router = express.Router();
const { addMarks, getMarks, getMarksByExam, getStudentAllMarks } = require("../controllers/marksController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

router.post("/add", auth, authorizeRole("Teacher", "Admin", "ExamCell"), addMarks);
router.get("/student/:studentId", auth, getStudentAllMarks);
router.get("/:examId/:studentId", auth, getMarks);
router.get("/exam/:examId", auth, authorizeRole("Teacher", "Admin", "ExamCell"), getMarksByExam);

module.exports = router;
