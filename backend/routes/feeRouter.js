const express = require("express");
const router = express.Router();
const { 
    getAllFees, 
    getStudentFee, 
    updateFeeStatus, 
    addAppliedCharges, 
    createFeeRecord,
    bulkUpdateDefaulterStatus,
    toggleDefaulterStatus 
} = require("../controllers/feeController");
const { auth, authorizeRole } = require("../middleware/authMiddleware");

// Define roles that can manage fees (Admission staff, Admin, and high-level management)
const feeManagerRoles = ["AdmissionCell", "Admin", "ManagementCell"];

router.get("/all", auth, authorizeRole(...feeManagerRoles), getAllFees);
router.get("/student/:studentId", auth, getStudentFee);
router.get("/student", auth, getStudentFee); // For students to see their own

router.post("/update/:studentId", auth, authorizeRole(...feeManagerRoles), updateFeeStatus);
router.post("/apply-charges/:studentId", auth, authorizeRole(...feeManagerRoles), addAppliedCharges);
router.post("/bulk-defaulter", auth, authorizeRole(...feeManagerRoles), bulkUpdateDefaulterStatus);
router.patch("/defaulter/:studentId", auth, authorizeRole(...feeManagerRoles), toggleDefaulterStatus);
router.post("/create", auth, authorizeRole(...feeManagerRoles), createFeeRecord);

module.exports = router;
