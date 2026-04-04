const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  academicYear: {
    type: String,
    default: "2023-2024"
  },
  baseMonthlyFee: {
    type: Number,
    required: true,
    default: 5000
  },
  monthlyFees: [{
    month: {
        type: String,
        required: true,
        enum: ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"]
    },
    charges: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        description: String,
        isAdmissionFee: { type: Boolean, default: false }
    }],
    paidAmount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["Paid", "Partial", "Pending"],
        default: "Pending"
    },
    dueDate: { type: Date },
    lastPaymentDate: { type: Date }
  }],
  totalAmount: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  totalDue: {
    type: Number,
    default: 0
  },
  dueTillCurrentMonth: {
    type: Number,
    default: 0
  },
  isDefaulter: {
    type: Boolean,
    default: false
  },
  defaulterNote: {
    type: String,
    default: ""
  },
  transactions: [{
    amount: Number,
    month: String,
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ["Cash", "Online", "Card", "UPI"], default: "Cash" },
    remarks: String
  }]
}, { timestamps: true });

// Pre-save middleware to calculate totals and adjust overpayments
feeSchema.pre("save", async function() {
    // 1. Calculate the total money actually paid across the entire year
    let totalPaidInLedger = this.monthlyFees.reduce((acc, m) => acc + (Number(m.paidAmount) || 0), 0);
    let pool = totalPaidInLedger;
    let totalAmount = 0;

    // 2. Redistribute pool across months in order
    for (let i = 0; i < this.monthlyFees.length; i++) {
        const m = this.monthlyFees[i];
        const monthTotal = m.charges.reduce((acc, c) => acc + c.amount, 0);
        totalAmount += monthTotal;

        if (pool >= monthTotal) {
            // If it's NOT the last month, we only take what's needed for this month
            // If it IS the last month, we take the entire remaining pool (allows negative due/extra credit)
            if (i < this.monthlyFees.length - 1) {
                m.paidAmount = monthTotal;
                m.status = "Paid";
                pool -= monthTotal;
            } else {
                m.paidAmount = pool;
                m.status = "Paid";
                pool = 0;
            }
        } else if (pool > 0) {
            // Partial payment for this month
            m.paidAmount = pool;
            m.status = "Partial";
            pool = 0;
        } else {
            // No money left for this month
            m.paidAmount = 0;
            m.status = "Pending";
            pool = 0;
        }
    }

    this.totalAmount = totalAmount;
    this.totalPaid = totalPaidInLedger;
    this.totalDue = totalAmount - totalPaidInLedger;

    // 3. Calculate Due Till Current Month (Academic Year starts in April)
    const monthsOrder = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
    const currentMonthIndex_Real = new Date().getMonth(); // 0-11 (Jan-Dec)
    // Map real month index to academic month index (April is 0)
    // April (3) -> 0, May (4) -> 1, ..., Dec (11) -> 8, Jan (0) -> 9, Feb (1) -> 10, March (2) -> 11
    const academicMonthIndex = (currentMonthIndex_Real - 3 + 12) % 12;

    let amountDueTillNow = 0;
    for (let i = 0; i <= academicMonthIndex; i++) {
        const m = this.monthlyFees.find(mf => mf.month === monthsOrder[i]);
        if (m) {
            amountDueTillNow += m.charges.reduce((acc, c) => acc + c.amount, 0);
        }
    }
    
    this.dueTillCurrentMonth = Math.max(0, amountDueTillNow - totalPaidInLedger);
});

module.exports = mongoose.model("Fee", feeSchema);
