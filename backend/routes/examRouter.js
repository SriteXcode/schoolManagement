const express = require("express");
const router = express.Router();
const { createExam, getExams } = require("../controllers/examController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

router.post("/create", auth, authorizeRole(...teacherRoles), createExam);
router.get("/:sClass", auth, getExams);

module.exports = router;
