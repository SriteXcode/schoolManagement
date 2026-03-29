const express = require("express");
const router = express.Router();
const { getPendingUsers, updateUserStatus, sendMessage, getAllMessages, updateMessageStatus, getMessagesForUser } = require("../controllers/adminExtrasController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const teacherRoles = ["Teacher", "Admin", "ExamCell", "AdmissionCell", "DisciplineCell", "SportsCell", "ManagementCell"];

// User Approvals (Admin Only)
router.get("/users/pending", auth, authorizeRole("Admin"), getPendingUsers);
router.put("/users/status", auth, authorizeRole("Admin"), updateUserStatus);

// Communication (Public & Private)
router.post("/comms/send", sendMessage); // Public (Login not required for Contact Us)
router.post("/comms/send-auth", auth, sendMessage); // Private (For logged in users)
router.get("/comms/all", auth, authorizeRole("Admin"), getAllMessages);
router.get("/comms/my-inbox", auth, getMessagesForUser); // For Teachers
router.put("/comms/status", auth, authorizeRole(...teacherRoles), updateMessageStatus);

module.exports = router;
