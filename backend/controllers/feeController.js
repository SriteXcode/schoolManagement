const Fee = require("../models/feeSchema");
const Student = require("../models/studentSchema");

// Get all fees (Admission Cell / Admin) with filtering
exports.getAllFees = async (req, res) => {
  try {
    const { minDue, pendingMonth } = req.query;
    let query = {};

    if (minDue) {
        query.totalDue = { $gte: Number(minDue) };
    }

    if (pendingMonth) {
        query.monthlyFees = {
            $elemMatch: {
                month: pendingMonth,
                status: { $ne: "Paid" }
            }
        };
    }

    const fees = await Fee.find(query).populate({
      path: 'student',
      populate: { path: 'sClass' }
    });
    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle defaulter status for a student
exports.toggleDefaulterStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { isDefaulter, defaulterNote } = req.body;
        const Notice = require("../models/noticeSchema");

        const fee = await Fee.findOneAndUpdate(
            { student: studentId },
            { isDefaulter, defaulterNote },
            { new: true }
        ).populate('student');

        if (!fee) return res.status(404).json({ message: "Fee record not found" });

        // Create a Notice for this student
        await Notice.create({
            title: isDefaulter ? "Urgent: Fee Default Notice" : "Fee Status Updated",
            details: isDefaulter 
                ? `Our records indicate that fee payments for ${fee.student.name} are pending. Please clear your dues at the earliest.`
                : `Your fee status for ${fee.student.name} has been updated to Regular.`,
            targetAudience: 'Student',
            date: new Date()
        });

        res.status(200).json({ message: `Student status updated successfully`, fee });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single student fee (Student / Admission Cell / Admin)
exports.getStudentFee = async (req, res) => {
  try {
    let studentId;
    if (req.user.role === 'Student') {
        const student = await Student.findOne({ user: req.user._id });
        if (!student) return res.status(404).json({ message: "Student profile not found" });
        studentId = student._id;
    } else {
        studentId = req.params.studentId;
    }
    
    const fee = await Fee.findOne({ student: studentId }).populate('student');
    if (!fee) {
      return res.status(404).json({ message: "Monthly fee records not initialized." });
    }
    res.status(200).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update specific month fee (Admission Cell)
exports.updateFeeStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, amount, paymentMethod, remarks } = req.body;

    let fee = await Fee.findOne({ student: studentId });
    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    const monthRecord = fee.monthlyFees.find(m => m.month === month);
    if (!monthRecord) return res.status(404).json({ message: "Invalid month specified" });

    // Update month totals
    monthRecord.paidAmount += Number(amount);
    monthRecord.lastPaymentDate = new Date();

    // Add global transaction
    fee.transactions.push({
      amount: Number(amount),
      month,
      paymentMethod,
      remarks,
      date: new Date()
    });

    await fee.save(); // Triggers totals calculation
    res.status(200).json({ message: "Fee updated successfully", fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initial fee setup for new student (Admission Cell)
exports.createFeeRecord = async (req, res) => {
  try {
    const { studentId, baseMonthlyFee, admissionFee } = req.body;
    const existingFee = await Fee.findOne({ student: studentId });
    if (existingFee) {
        return res.status(400).json({ message: "Fee record already exists" });
    }

    const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
    const monthlyFees = months.map((m, idx) => {
        const charges = [{ name: "Monthly Tuition Fee", amount: baseMonthlyFee }];
        if (m === "April" && admissionFee > 0) {
            charges.push({ name: "Admission Fee", amount: admissionFee, isAdmissionFee: true });
        }
        return {
            month: m,
            charges,
            paidAmount: 0,
            status: "Pending",
            dueDate: new Date(2023, (idx + 3) % 12, 10) // 10th of each month
        };
    });

    const fee = await Fee.create({
      student: studentId,
      baseMonthlyFee,
      monthlyFees
    });

    res.status(201).json({ message: "Fee records initialized", fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add extra charge to a specific month
exports.addAppliedCharges = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, name, amount, description } = req.body;

        const fee = await Fee.findOne({ student: studentId });
        const monthRecord = fee.monthlyFees.find(m => m.month === month);
        
        if (monthRecord) {
            monthRecord.charges.push({ name, amount: Number(amount), description });
            await fee.save();
            res.status(200).json(fee);
        } else {
            res.status(404).json({ message: "Month not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Bulk update defaulter status (Admission Cell / Admin)
exports.bulkUpdateDefaulterStatus = async (req, res) => {
    try {
        const { studentIds, isDefaulter, defaulterNote } = req.body;
        const Notice = require("../models/noticeSchema");

        // 1. Update Fee Records
        const result = await Fee.updateMany(
            { student: { $in: studentIds } },
            { isDefaulter, defaulterNote }
        );

        // 2. Create a Notice for these students
        if (studentIds.length > 0) {
            const studentNames = await Student.find({ _id: { $in: studentIds } }).select('name');
            const namesStr = studentNames.slice(0, 3).map(s => s.name).join(', ') + (studentNames.length > 3 ? '...' : '');

            await Notice.create({
                title: isDefaulter ? "Urgent: Fee Default Notice" : "Fee Status Updated: Regular",
                details: isDefaulter 
                    ? `Our records indicate that fee payments for ${namesStr} are pending. Please clear your dues at the earliest to avoid further action. Contact Admission Cell for details.`
                    : `Your fee status for ${namesStr} has been updated to Regular. Thank you for your cooperation.`,
                targetAudience: 'Student', // In a real system, we might want a 'SpecificStudents' audience, but here we can use a general notice or send to their classes
                date: new Date()
            });
        }

        res.status(200).json({ 
            message: `Bulk update successful. ${result.modifiedCount} records updated.`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
