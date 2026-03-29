const express = require("express");
const router = express.Router();
const { createNotice, getNotices } = require("../controllers/noticeController");
const { auth, authorizeRole, optionalAuth } = require("../middleware/authMiddleware");

router.post("/create", auth, authorizeRole("Admin"), createNotice);
router.get("/getall", optionalAuth, getNotices);

module.exports = router;
