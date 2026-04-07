const express = require("express");
const router = express.Router();
const { 
    addStaff, getAllStaff, saveSalary, getSalaries, 
    addBus, getAllBuses, updateSchoolConfig, getSchoolConfig,
    addGalleryItem, getGalleryItems, addAchievement, addCarouselItem, getCarouselItems,
    getMessages, markMessageRead, assignStudentToBus, getStudentsByBus, updateBusNickname,
    getStaffSalaryHistory, getSalaryReceipt, updateBus,
    addSchedulePhase, getSchedulePhases, updateSchedulePhase, getTimetable, updateTimetable,
    getTeacherSchedule, requestLeave, getTeacherLeaves, getAllLeaves, updateLeaveStatus,
    deleteSchedulePhase, deleteTimetable
} = require("../controllers/managementController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

const mgmtRoles = ["Admin", "ManagementCell"];

// Staff
router.post("/staff/add", auth, authorizeRole(...mgmtRoles), addStaff);
router.get("/staff/all", auth, authorizeRole(...mgmtRoles), getAllStaff);

// Salary
router.post("/salary/save", auth, authorizeRole(...mgmtRoles), saveSalary);
router.get("/salary/all", auth, authorizeRole(...mgmtRoles), getSalaries);
router.get("/salary/history/:staffId", auth, getStaffSalaryHistory);
router.get("/salary/receipt/:id", auth, getSalaryReceipt);

// Transport
router.post("/bus/add", auth, authorizeRole(...mgmtRoles), addBus);
router.get("/bus/all", auth, getAllBuses); // Accessible to all logged-in users
router.put("/bus/:id", auth, authorizeRole(...mgmtRoles), updateBus);
router.post("/bus/assign-student", auth, authorizeRole(...mgmtRoles), assignStudentToBus);
router.get("/bus/:busId/students", auth, authorizeRole(...mgmtRoles), getStudentsByBus);
router.put("/bus/nickname", auth, updateBusNickname); // Students can also update nickname

// Scheduling & Timetable
router.post("/schedule/phase/add", auth, authorizeRole(...mgmtRoles), addSchedulePhase);
router.post("/schedule/phase/update/:id", auth, authorizeRole(...mgmtRoles), updateSchedulePhase);
router.get("/schedule/phase/all", auth, authorizeRole(...mgmtRoles), getSchedulePhases);
router.delete("/schedule/phase/:id", auth, authorizeRole("Admin"), deleteSchedulePhase);
router.get("/schedule/timetable/:classId/:phaseId", auth, authorizeRole(...mgmtRoles), getTimetable);
router.post("/schedule/timetable/update", auth, authorizeRole(...mgmtRoles), updateTimetable);
router.delete("/schedule/timetable/:classId/:phaseId", auth, authorizeRole("Admin"), deleteTimetable);
router.get("/schedule/teacher/:teacherId", auth, getTeacherSchedule);

// Leave Management
router.post("/leave/request", auth, authorizeRole("Teacher"), requestLeave);
router.get("/leave/my-leaves", auth, authorizeRole("Teacher"), getTeacherLeaves);
router.get("/leave/all", auth, authorizeRole(...mgmtRoles), getAllLeaves);
router.patch("/leave/status/:id", auth, authorizeRole(...mgmtRoles), updateLeaveStatus);

// School Config
router.get("/school/config", auth, getSchoolConfig); // Accessible to all logged-in users
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
