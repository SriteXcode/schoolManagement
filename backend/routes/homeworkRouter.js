const express = require("express");
const router = express.Router();
const { createHomework, getHomework, updateHomeworkStatus, updateHomework } = require("../controllers/homeworkController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

router.post("/create", auth, authorizeRole(...teacherRoles), createHomework);
router.get("/:sClass", auth, getHomework);
router.put("/status", auth, authorizeRole("Student"), updateHomeworkStatus);
router.put("/:id", auth, authorizeRole(...teacherRoles), updateHomework);

module.exports = router;
