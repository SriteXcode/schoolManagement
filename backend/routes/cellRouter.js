const express = require("express");
const router = express.Router();
const { 
    assignTeacherToCell, 
    reportIncident, 
    getAllIncidents, 
    addSportsRecord, 
    getSportsRecords 
} = require("../controllers/cellController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const staffRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

// Admin Only
router.post("/assign", auth, authorizeRole("Admin"), assignTeacherToCell);

// Discipline Cell
router.post("/discipline/report", auth, authorizeRole(...staffRoles), reportIncident);
router.get("/discipline/all", auth, authorizeRole(...staffRoles), getAllIncidents);

// Sports Cell
router.post("/sports/record", auth, authorizeRole(...staffRoles), addSportsRecord);
router.get("/sports/all", auth, authorizeRole(...staffRoles), getSportsRecords);

module.exports = router;
