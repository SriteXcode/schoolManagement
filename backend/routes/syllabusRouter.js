const express = require("express");
const router = express.Router();
const { 
    createSyllabus, 
    getAllSyllabus, 
    getSyllabusByClass, 
    getSyllabusById,
    updateChapter, 
    updateTopics,
    deleteSyllabus 
} = require("../controllers/syllabusController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

// Define teacher-like roles that can manage syllabus
const teacherRoles = ["Teacher", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];
const adminRoles = ["Admin", "ManagementCell"];

// Admin / Office Roles
router.post("/create", auth, authorizeRole("Admin", "ExamCell", "ManagementCell"), createSyllabus);
router.get("/all", auth, authorizeRole("Admin", "ManagementCell", "ExamCell"), getAllSyllabus);
router.delete("/delete/:id", auth, authorizeRole("Admin"), deleteSyllabus);

// General Roles (Viewing)
router.get("/class/:id", auth, getSyllabusByClass);
router.get("/details/:id", auth, getSyllabusById);

// Teacher Updates - Expanded to allow all specialized teacher roles
router.put("/update-chapter/:id", auth, authorizeRole(...teacherRoles, "Admin"), updateChapter);
router.put("/update-topic/:id/:chapterNo", auth, authorizeRole(...teacherRoles, "Admin"), updateTopics);

module.exports = router;
