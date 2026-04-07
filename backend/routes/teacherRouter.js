const express = require("express");
const router = express.Router();
const { registerTeacher, getTeachers, updateTeacher, getTeacherAssignments, getTeacherProfile, deleteTeacher } = require("../controllers/teacherController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

router.post("/register", auth, authorizeRole("Admin"), registerTeacher);
router.get("/getall", auth, getTeachers);
router.get("/profile", auth, getTeacherProfile);
router.put("/update/:id", auth, authorizeRole("Admin", "Teacher"), updateTeacher);
router.get("/assignments/:id", auth, authorizeRole("Admin"), getTeacherAssignments);
router.delete("/:id", auth, authorizeRole("Admin"), deleteTeacher);

module.exports = router;
