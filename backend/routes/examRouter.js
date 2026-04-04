const express = require("express");
const router = express.Router();
const { createExam, getExams, getAllExams, bulkCreateExams, deleteExam, updateExam } = require("../controllers/examController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Admin", "ExamCell"];

router.get("/all", auth, getAllExams);
router.post("/create", auth, authorizeRole(...teacherRoles), createExam);
router.post("/bulk-create", auth, authorizeRole(...teacherRoles), bulkCreateExams);
router.get("/:sClass", auth, getExams);
router.delete("/delete/:id", auth, authorizeRole(...teacherRoles), deleteExam);
router.put("/update/:id", auth, authorizeRole(...teacherRoles), updateExam);

module.exports = router;
