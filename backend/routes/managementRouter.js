const express = require("express");
const router = express.Router();
const { 
    addStaff, getAllStaff, saveSalary, getSalaries, 
    addBus, getAllBuses, updateSchoolConfig, getSchoolConfig,
    addGalleryItem, getGalleryItems, addAchievement, addCarouselItem, getCarouselItems,
    getMessages, markMessageRead
} = require("../controllers/managementController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const mgmtRoles = ["Admin", "ManagementCell"];

// Staff
router.post("/staff/add", auth, authorizeRole(...mgmtRoles), addStaff);
router.get("/staff/all", auth, authorizeRole(...mgmtRoles), getAllStaff);

// Salary
router.post("/salary/save", auth, authorizeRole(...mgmtRoles), saveSalary);
router.get("/salary/all", auth, authorizeRole(...mgmtRoles), getSalaries);

// Transport
router.post("/bus/add", auth, authorizeRole(...mgmtRoles), addBus);
router.get("/bus/all", auth, authorizeRole(...mgmtRoles), getAllBuses);

// School Config
router.get("/school/config", auth, authorizeRole(...mgmtRoles), getSchoolConfig);
router.put("/school/config", auth, authorizeRole(...mgmtRoles), updateSchoolConfig);

// Content
router.get("/carousel/all", getCarouselItems); // Public
router.get("/gallery/all", getGalleryItems); // Public
router.post("/gallery/add", auth, authorizeRole(...mgmtRoles), addGalleryItem);
router.post("/achievement/add", auth, authorizeRole(...mgmtRoles), addAchievement);
router.post("/carousel/add", auth, authorizeRole(...mgmtRoles), addCarouselItem);

// Messages
router.get("/messages", auth, authorizeRole(...mgmtRoles), getMessages);
router.put("/messages/:id/read", auth, authorizeRole(...mgmtRoles), markMessageRead);

module.exports = router;
