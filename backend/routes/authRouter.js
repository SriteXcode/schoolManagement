const express = require("express");
const router = express.Router();
const { register, login, updateProfile } = require("../controllers/authController");
const { auth } = require("../middleware/authMiddleware");

router.post("/register", register); 
router.post("/login", login);
router.put("/update-profile", auth, updateProfile);

module.exports = router;
