const express = require("express");
const router = express.Router();
const { getAllSalaries, getTeacherSalaryHistory, addSalaryRecord, markSalaryAsPaid } = require("../controllers/salaryController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

router.get("/all", auth, authorizeRole("Admin"), getAllSalaries);
router.get("/teacher/:teacherId", auth, getTeacherSalaryHistory);
router.get("/teacher", auth, getTeacherSalaryHistory); // For teachers
router.post("/record", auth, authorizeRole("Admin"), addSalaryRecord);
router.post("/pay/:id", auth, authorizeRole("Admin"), markSalaryAsPaid);

module.exports = router;
