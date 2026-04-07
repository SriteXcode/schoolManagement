const express = require("express");
const router = express.Router();
const { registerStudent, getStudents, getStudentProfile, updateStudent, getStudentsByClass, addStudentReview, transferClass, unassignClass, deleteStudent } = require("../controllers/studentController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const staffRoles = ["Admin", "AdmissionCell", "ExamCell", "DisciplineCell", "SportsCell", "ManagementCell"];

router.post("/register", auth, authorizeRole("Admin", "AdmissionCell"), registerStudent);
router.post("/transfer-class", auth, authorizeRole("Admin", "AdmissionCell"), transferClass);
router.post("/unassign-class", auth, authorizeRole("Admin", "AdmissionCell"), unassignClass);
router.get("/getall", auth, authorizeRole(...staffRoles), getStudents); 
router.get("/class/:id", auth, authorizeRole(...staffRoles), getStudentsByClass);
router.get("/profile", auth, getStudentProfile);
router.put("/update/:id", auth, authorizeRole(...staffRoles, "Student"), updateStudent);
router.post("/review/:id", auth, authorizeRole(...staffRoles), addStudentReview);
router.delete("/:id", auth, authorizeRole("Admin"), deleteStudent);

module.exports = router;
