const Salary = require("../models/salarySchema");
const Teacher = require("../models/teacherSchema");

// Get all salaries (Admin)
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find().populate('teacher');
    res.status(200).json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher salary history (Teacher / Admin)
exports.getTeacherSalaryHistory = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    const teacherId = req.user.role === 'Teacher' ? teacher._id : req.params.teacherId;

    const salaries = await Salary.find({ teacher: teacherId }).sort({ year: -1, month: -1 });
    res.status(200).json(salaries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add/Update salary record (Admin)
exports.addSalaryRecord = async (req, res) => {
  try {
    const { teacherId, month, year, baseSalary, bonuses, deductions, paymentMethod, status } = req.body;
    
    const bonusesTotal = (bonuses || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const deductionsTotal = (deductions || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalAmount = Number(baseSalary) + bonusesTotal - deductionsTotal;

    const salary = await Salary.findOneAndUpdate(
        { teacher: teacherId, month, year },
        { 
            baseSalary: Number(baseSalary), 
            bonuses, 
            deductions, 
            totalAmount, 
            paymentMethod, 
            status,
            paymentDate: status === "Paid" ? new Date() : null
        },
        { upsert: true, new: true }
    );

    res.status(200).json({ message: "Salary record saved successfully", salary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update status to Paid (Admin)
exports.markSalaryAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const salary = await Salary.findByIdAndUpdate(
      id,
      { 
        status: "Paid", 
        paymentDate: new Date(),
        paymentMethod 
      },
      { new: true }
    );

    res.status(200).json({ message: "Salary marked as paid", salary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
