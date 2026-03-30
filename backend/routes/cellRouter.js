const express = require("express");
const router = express.Router();
const { 
    assignTeacherToCell, 
    reportIncident, 
    getAllIncidents, 
    updateIncident,
    deleteIncident,
    addSportsRecord, 
    getSportsRecords,
    updateSportsRecord,
    deleteSportsRecord
} = require("../controllers/cellController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const staffRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

// Admin Only
router.post("/assign", auth, authorizeRole("Admin"), assignTeacherToCell);

// Discipline Cell
router.post("/discipline/report", auth, authorizeRole(...staffRoles), reportIncident);
router.get("/discipline/all", auth, authorizeRole(...staffRoles), getAllIncidents);
router.put("/discipline/:id", auth, authorizeRole(...staffRoles), updateIncident);
router.delete("/discipline/:id", auth, authorizeRole(...staffRoles), deleteIncident);

// Sports Cell
router.post("/sports/record", auth, authorizeRole(...staffRoles), addSportsRecord);
router.get("/sports/all", auth, authorizeRole(...staffRoles), getSportsRecords);
router.put("/sports/:id", auth, authorizeRole(...staffRoles), updateSportsRecord);
router.delete("/sports/:id", auth, authorizeRole(...staffRoles), deleteSportsRecord);

module.exports = router;
