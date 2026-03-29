const express = require("express");
const router = express.Router();
const { createClass, getClasses, assignTeacher, getClassDetails, updateSubjects } = require("../controllers/classController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

router.post("/create", auth, authorizeRole("Admin"), createClass);
router.put("/assign-teacher", auth, authorizeRole("Admin"), assignTeacher);
router.put("/update-subjects", auth, authorizeRole("Admin"), updateSubjects);
router.get("/getall", auth, getClasses); 
router.get("/details/:id", auth, getClassDetails);

module.exports = router;
