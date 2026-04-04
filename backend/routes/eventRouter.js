const express = require("express");
const router = express.Router();
const { createEvent, getEvents, deleteEvent, updateEvent } = require("../controllers/eventController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

// Public route to view events
router.get("/getall", getEvents);

// Admin only routes
router.post("/create", auth, authorizeRole("Admin"), createEvent);
router.delete("/delete/:id", auth, authorizeRole("Admin"), deleteEvent);
router.put("/update/:id", auth, authorizeRole("Admin"), updateEvent);

module.exports = router;
