const User = require("../models/userSchema");
const Staff = require("../models/staffSchema");
const Teacher = require("../models/teacherSchema");
const Salary = require("../models/salarySchema");
const Attendance = require("../models/attendanceSchema");
const Bus = require("../models/busSchema");
const School = require("../models/schoolSchema");
const Gallery = require("../models/gallerySchema");
const Achievement = require("../models/achievementSchema");
const ContactMessage = require("../models/contactMessageSchema");
const Carousel = require("../models/carouselSchema");

// --- Staff Management ---
exports.addStaff = async (req, res) => {
    try {
        const { name, email, phone, password, role, idNum, department, salary, address, dateOfJoining } = req.body;
        
        // Create User
        const user = await User.create({
            name, email, phone, password, role, status: "Approved"
        });

        // Create Staff Profile
        const staff = await Staff.create({
            user: user._id, name, idNum, phone, role, department, salary, address, dateOfJoining
        });

        res.status(201).json({ message: "Staff added successfully", staff });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStaff = async (req, res) => {
    try {
        const teachers = await Teacher.find().populate("user", "-password");
        const otherStaff = await Staff.find().populate("user", "-password");
        res.status(200).json({ teachers, otherStaff });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Salary Management ---
exports.saveSalary = async (req, res) => {
    try {
        const { staffId, staffModel, month, year, baseSalary, bonus, increment, hike, deductions, status, paymentMethod } = req.body;
        
        const totalAmount = Number(baseSalary) + Number(bonus || 0) + Number(increment || 0) + Number(hike || 0) - (deductions || []).reduce((acc, d) => acc + Number(d.amount), 0);

        const salaryRecord = await Salary.create({
            staff: staffId, staffModel, month, year, baseSalary, bonus, increment, hike, deductions, totalAmount, status, paymentMethod,
            paymentDate: status === "Paid" ? new Date() : null
        });

        res.status(201).json({ message: "Salary record saved", salaryRecord });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSalaries = async (req, res) => {
    try {
        const salaries = await Salary.find().populate("staff");
        res.status(200).json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Transport Management ---
exports.addBus = async (req, res) => {
    try {
        const bus = await Bus.create(req.body);
        res.status(201).json({ message: "Bus added", bus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBuses = async (req, res) => {
    try {
        const buses = await Bus.find().populate("driver");
        res.status(200).json(buses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- School & Content Management ---
exports.updateSchoolConfig = async (req, res) => {
    try {
        const school = await School.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.status(200).json({ message: "School configuration updated", school });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSchoolConfig = async (req, res) => {
    try {
        const school = await School.findOne();
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Media & Content ---
exports.addGalleryItem = async (req, res) => {
    try {
        const item = await Gallery.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGalleryItems = async (req, res) => {
    try {
        const items = await Gallery.find().sort("-date");
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addAchievement = async (req, res) => {
    try {
        const item = await Achievement.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addCarouselItem = async (req, res) => {
    try {
        const item = await Carousel.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCarouselItems = async (req, res) => {
    try {
        const items = await Carousel.find().sort("order");
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Messages ---
exports.getMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort("-date");
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markMessageRead = async (req, res) => {
    try {
        const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status: "Read" }, { new: true });
        res.status(200).json(msg);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
