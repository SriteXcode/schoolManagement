const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Student = require("../models/studentSchema");
const Fee = require("../models/feeSchema");

dotenv.config({ path: path.join(__dirname, "../.env") });

const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

const seedFees = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/school_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to DB. Seeding Monthly Fee records...");

    const students = await Student.find();
    if (students.length === 0) {
        console.log("No students found. Seed students first.");
        process.exit(1);
    }

    await Fee.deleteMany({});

    const baseMonthlyFee = 5000;
    const admissionFee = 10000;
    const feeRecords = [];

    for (const student of students) {
        const monthlyFees = months.map((m, idx) => {
            const charges = [{ name: "Monthly Tuition Fee", amount: baseMonthlyFee }];
            if (m === "April") {
                charges.push({ name: "Admission Fee", amount: admissionFee, isAdmissionFee: true });
            }

            const monthTotal = charges.reduce((acc, c) => acc + c.amount, 0);
            
            // Randomize status: First few months more likely to be paid
            let paidAmount = 0;
            if (idx < 4) {
                paidAmount = monthTotal; // fully paid
            } else if (idx === 4) {
                paidAmount = 2500; // partially paid
            }

            return {
                month: m,
                charges,
                paidAmount: paidAmount,
                dueDate: new Date(2023, (idx + 3) % 12, 10),
                lastPaymentDate: paidAmount > 0 ? new Date() : null
            };
        });

        feeRecords.push({
            student: student._id,
            baseMonthlyFee,
            academicYear: "2023-2024",
            monthlyFees
        });
    }

    await Fee.insertMany(feeRecords);
    console.log(`Successfully seeded ${feeRecords.length} monthly fee structures! 💸`);
    process.exit(0);
  } catch (err) {
    console.error("Fee seed failed:", err);
    process.exit(1);
  }
};

seedFees();
