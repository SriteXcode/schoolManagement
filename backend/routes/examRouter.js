const express = require("express");
const router = express.Router();
const { createExam, getExams, getAllExams, bulkCreateExams } = require("../controllers/examController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

router.get("/all", auth, getAllExams);
router.post("/create", auth, authorizeRole(...teacherRoles), createExam);
router.post("/bulk-create", auth, authorizeRole(...teacherRoles), bulkCreateExams);
router.get("/:sClass", auth, getExams);

module.exports = router;
