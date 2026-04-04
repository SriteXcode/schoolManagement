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
const Student = require("../models/studentSchema");
const Fee = require("../models/feeSchema");
const SchedulePhase = require("../models/schedulePhaseSchema");
const Timetable = require("../models/timetableSchema");
const { validateSessionDate } = require("../middleware/sessionMiddleware");

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
        const salaries = await Salary.find().populate("staff").sort("-year -month");
        res.status(200).json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStaffSalaryHistory = async (req, res) => {
    try {
        const { staffId } = req.params;
        const salaries = await Salary.find({ staff: staffId }).sort("-year -month");
        res.status(200).json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSalaryReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        const salary = await Salary.findById(id).populate("staff");
        if (!salary) return res.status(404).json({ message: "Salary record not found" });
        res.status(200).json(salary);
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

exports.updateBus = async (req, res) => {
    try {
        const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bus) return res.status(404).json({ message: "Bus not found" });
        res.status(200).json({ message: "Bus updated successfully", bus });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignStudentToBus = async (req, res) => {
    try {
        const { studentId, busId, busStop, busJoiningDate } = req.body;
        const joiningDate = busJoiningDate ? new Date(busJoiningDate) : new Date();

        if (!busId) {
            await Student.findByIdAndUpdate(studentId, { bus: null, transportMode: "Private", busStop: "", busJoiningDate: null });
            
            const feeRecord = await Fee.findOne({ student: studentId });
            if (feeRecord) {
                feeRecord.monthlyFees.forEach(monthEntry => {
                    monthEntry.charges = monthEntry.charges.filter(c => c.name !== "Transport Fee");
                });
                await feeRecord.save();
            }
            return res.status(200).json({ message: "Student removed from bus and transport fees cancelled" });
        }

        const bus = await Bus.findById(busId);
        if (!bus) return res.status(404).json({ message: "Bus not found" });

        const stop = bus.stops.find(s => s.stopName === busStop);
        const transportFeeAmount = stop ? stop.fee : 0;

        const assignedCount = await Student.countDocuments({ bus: busId });
        if (assignedCount >= bus.capacity) {
            return res.status(400).json({ message: "Bus is at full capacity" });
        }

        await Student.findByIdAndUpdate(studentId, { 
            bus: busId, 
            transportMode: "Bus",
            busStop: busStop || "",
            busJoiningDate: joiningDate
        });

        const feeRecord = await Fee.findOne({ student: studentId });
        if (feeRecord) {
            const startMonthIndex = (joiningDate.getMonth() - 3 + 12) % 12;
            
            feeRecord.monthlyFees.forEach((monthEntry, idx) => {
                monthEntry.charges = monthEntry.charges.filter(c => c.name !== "Transport Fee");
                
                if (idx >= startMonthIndex && transportFeeAmount > 0) {
                    monthEntry.charges.push({
                        name: "Transport Fee",
                        amount: transportFeeAmount,
                        description: `Bus: ${bus.busNumber}, Stop: ${busStop}`
                    });
                }
            });
            await feeRecord.save();
        }

        res.status(200).json({ message: "Student assigned to bus and fees updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentsByBus = async (req, res) => {
    try {
        const students = await Student.find({ bus: req.params.busId }).populate("sClass");
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateBusNickname = async (req, res) => {
    try {
        const { studentId, nickname } = req.body;
        await Student.findByIdAndUpdate(studentId, { busNickname: nickname });
        res.status(200).json({ message: "Bus nickname updated" });
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
        const Communication = require("../models/commSchema");
        const user = req.user;

        const contactMessages = await ContactMessage.find().lean();
        const communications = await Communication.find({ 
            $or: [
                { type: "Contact" },
                { recipient: null } // This includes problems to Admin
            ]
        }).populate("user", "name email role").lean();

        // Standardize format
        let formattedContact = contactMessages.map(m => ({
            _id: m._id,
            name: m.name,
            email: m.email,
            subject: m.subject || "Contact Us Message",
            message: m.message,
            status: m.status,
            date: m.date,
            source: "ContactForm"
        }));

        let formattedComms = communications.map(m => ({
            _id: m._id,
            name: m.name || (m.user ? m.user.name : "Unknown"),
            email: m.email || (m.user ? m.user.email : ""),
            subject: m.type === "Contact" ? "Website Inquiry" : `Report: ${m.type}`,
            message: m.message,
            status: m.status,
            date: m.createdAt,
            source: "InternalComm",
            type: m.type
        }));

        // Filter for Management Cell
        if (user.role === "ManagementCell") {
            // Management sees ONLY: Website Inquiries, Bus Requests
            // They DON'T see Problems/Feedback (only for Admin)
            formattedContact = formattedContact.filter(m => m.subject.includes("BUS") || m.subject === "Contact Us Message");
            formattedComms = formattedComms.filter(m => m.type === "Contact" || m.type === "BusRequest");
        }

        const allMessages = [...formattedContact, ...formattedComms].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.status(200).json(allMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markMessageRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Status like "Read", "Solved", "Approved"
        const Communication = require("../models/commSchema");

        // Try ContactMessage first
        let msg = await ContactMessage.findById(id);
        let model = ContactMessage;

        if (!msg) {
            msg = await Communication.findById(id).populate("user");
            model = Communication;
        }

        if (!msg) return res.status(404).json({ message: "Message not found" });

        // Update status
        msg.status = (status === "Solved" ? "Resolved" : (status || "Read"));
        await msg.save();

        // --- AUTOMATIC BUS LOGIC ---
        if (status === "Approved" && (msg.type === "BusRequest" || msg.subject?.includes("BUS"))) {
            // Extract Bus Number and Stop from message
            // Expected: "Bus: [Number] | Stop: [Stop Name]" or similar
            const busMatch = msg.message.match(/Bus:\s*(\w+)/i);
            const stopMatch = msg.message.match(/Stop:\s*([^|\n]+)/i);

            if (busMatch && stopMatch && (msg.user || msg.source === "ContactForm")) {
                const busNumber = busMatch[1].trim();
                const stopName = stopMatch[1].trim();
                
                // 1. Find the Bus
                const bus = await Bus.findOne({ busNumber: new RegExp(`^${busNumber}$`, 'i') });
                
                if (bus) {
                    // 2. Add Stop if not exists
                    const stopExists = bus.stops.find(s => s.stopName.toLowerCase() === stopName.toLowerCase());
                    if (!stopExists) {
                        bus.stops.push({ stopName, fee: 0 }); // Default fee 0, management can update later
                        await bus.save();
                    }

                    // 3. Assign Student (if we have a user/student linked)
                    if (msg.user) {
                        const student = await Student.findOne({ user: msg.user._id || msg.user });
                        if (student) {
                            // Call internal assignStudentToBus logic or just update
                            student.bus = bus._id;
                            student.transportMode = "Bus";
                            student.busStop = stopName;
                            student.busJoiningDate = new Date();
                            await student.save();

                            // Also sync fee record if exists
                            const Fee = require("../models/feeSchema");
                            const feeRecord = await Fee.findOne({ student: student._id });
                            if (feeRecord) {
                                const stopObj = bus.stops.find(s => s.stopName.toLowerCase() === stopName.toLowerCase());
                                const transportFeeAmount = stopObj ? stopObj.fee : 0;
                                
                                const startMonthIndex = (new Date().getMonth() - 3 + 12) % 12;
                                feeRecord.monthlyFees.forEach((monthEntry, idx) => {
                                    if (idx >= startMonthIndex && transportFeeAmount > 0) {
                                        monthEntry.charges = monthEntry.charges.filter(c => c.name !== "Transport Fee");
                                        monthEntry.charges.push({
                                            name: "Transport Fee",
                                            amount: transportFeeAmount,
                                            description: `Bus: ${bus.busNumber}, Stop: ${stopName} (Auto-Approved)`
                                        });
                                    }
                                });
                                await feeRecord.save();
                            }
                        }
                    }
                }
            }
        }
        
        res.status(200).json(msg);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Scheduling & Timetable ---
exports.addSchedulePhase = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ message: "Start date cannot be after end date" });
        }

        // Academic Session Validation
        try {
            await validateSessionDate(startDate);
            await validateSessionDate(endDate);
        } catch (sessionError) {
            return res.status(400).json({ message: sessionError.message });
        }

        // Check for overlapping phases
        const overlap = await SchedulePhase.findOne({
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) }
        });

        if (overlap) {
            return res.status(400).json({ message: `Phase dates overlap with existing phase: ${overlap.name}` });
        }

        const phase = await SchedulePhase.create(req.body);
        res.status(201).json({ message: "Schedule phase created", phase });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSchedulePhases = async (req, res) => {
    try {
        const phases = await SchedulePhase.find().sort("-startDate");
        res.status(200).json(phases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSchedulePhase = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const phaseId = req.params.id;

        if (startDate) await validateSessionDate(startDate);
        if (endDate) await validateSessionDate(endDate);

        const currentPhase = await SchedulePhase.findById(phaseId);
        if (!currentPhase) return res.status(404).json({ message: "Phase not found" });

        const finalStartDate = startDate ? new Date(startDate) : currentPhase.startDate;
        const finalEndDate = endDate ? new Date(endDate) : currentPhase.endDate;

        if (new Date(finalStartDate) > new Date(finalEndDate)) {
            return res.status(400).json({ message: "Start date cannot be after end date" });
        }

        // Check for overlap excluding self
        const overlap = await SchedulePhase.findOne({
            _id: { $ne: phaseId },
            startDate: { $lte: finalEndDate },
            endDate: { $gte: finalStartDate }
        });

        if (overlap) {
            return res.status(400).json({ message: `Updated dates overlap with existing phase: ${overlap.name}` });
        }

        const phase = await SchedulePhase.findByIdAndUpdate(phaseId, req.body, { new: true });
        res.status(200).json({ message: "Schedule phase updated", phase });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTimetable = async (req, res) => {
    try {
        const { classId, phaseId } = req.params;
        const timetable = await Timetable.find({ sClass: classId, phase: phaseId })
            .populate("slots.teacher", "name");
        res.status(200).json(timetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTimetable = async (req, res) => {
    try {
        const { classId, phaseId, day, slots } = req.body;

        // Check for teacher overlap
        for (const slot of slots) {
            if (slot.teacher) {
                const overlap = await Timetable.findOne({
                    phase: phaseId,
                    day: day,
                    sClass: { $ne: classId },
                    "slots": {
                        $elemMatch: {
                            slotIndex: slot.slotIndex,
                            teacher: slot.teacher
                        }
                    }
                }).populate("sClass", "grade section");

                if (overlap) {
                    const TeacherModel = require("../models/teacherSchema");
                    const teacher = await TeacherModel.findById(slot.teacher);
                    return res.status(400).json({ 
                        message: `Conflict: Teacher ${teacher.name} is already assigned to Class ${overlap.sClass.grade}-${overlap.sClass.section} on ${day} during this period.` 
                    });
                }
            }
        }

        const timetable = await Timetable.findOneAndUpdate(
            { sClass: classId, phase: phaseId, day: day },
            { slots },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "Timetable updated", timetable });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
