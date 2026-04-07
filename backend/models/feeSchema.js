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
        isAdmissionFee: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["Paid", "Pending"],
            default: "Pending"
        },
        isManuallyPaid: { type: Boolean, default: false }
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
  allPaymentsTotal: {
    type: Number,
    default: 0
  },
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
  totalYearlyDue: {
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
    // 1. Calculate the total money actually paid across the entire year from allTransactionsTotal
    // if allPaymentsTotal is 0 but totalPaid is > 0 (migration case), sync them
    if (this.allPaymentsTotal === 0 && this.totalPaid > 0) {
        this.allPaymentsTotal = this.totalPaid;
    }

    let pool = this.allPaymentsTotal;
    let totalAmount = 0;

    // 2. Identify and lock manually paid charges
    let manuallyPaidTotal = 0;
    this.monthlyFees.forEach(m => {
        m.charges.forEach(c => {
            if (c.isManuallyPaid) {
                c.status = "Paid";
                manuallyPaidTotal += c.amount;
            }
        });
    });

    // The remaining pool is for automatic distribution (chronological)
    let distributionPool = Math.max(0, pool - manuallyPaidTotal);

    // 3. Redistribute distributionPool across months in order, skipping already paid charges
    for (let i = 0; i < this.monthlyFees.length; i++) {
        const m = this.monthlyFees[i];
        
        // Sum of manually paid charges in this month
        const manualInMonth = m.charges.filter(c => c.isManuallyPaid).reduce((acc, c) => acc + c.amount, 0);
        
        // Charges that need automatic payment
        const pendingChargesInMonth = m.charges.filter(c => !c.isManuallyPaid);
        const pendingTotalInMonth = pendingChargesInMonth.reduce((acc, c) => acc + c.amount, 0);
        
        const monthTotal = manualInMonth + pendingTotalInMonth;
        totalAmount += monthTotal;

        if (distributionPool >= pendingTotalInMonth) {
            // Can pay all pending charges in this month
            pendingChargesInMonth.forEach(c => c.status = "Paid");
            m.paidAmount = monthTotal;
            m.status = "Paid";
            distributionPool -= pendingTotalInMonth;
        } else if (distributionPool > 0) {
            // Partial payment for pending charges in this month
            let chargePool = distributionPool;
            pendingChargesInMonth.forEach(c => {
                if (chargePool >= c.amount) {
                    c.status = "Paid";
                    chargePool -= c.amount;
                } else {
                    c.status = "Pending";
                }
            });
            m.paidAmount = manualInMonth + distributionPool;
            m.status = "Partial";
            distributionPool = 0;
        } else {
            // No distribution pool left for this month
            pendingChargesInMonth.forEach(c => c.status = "Pending");
            m.paidAmount = manualInMonth;
            m.status = m.paidAmount >= monthTotal ? "Paid" : (m.paidAmount > 0 ? "Partial" : "Pending");
            distributionPool = 0;
        }
    }

    this.totalAmount = totalAmount;
    this.totalPaid = pool; // Use the absolute total paid
    this.totalYearlyDue = Math.max(0, totalAmount - pool);

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
    
    this.dueTillCurrentMonth = Math.max(0, amountDueTillNow - pool);
    this.totalDue = this.dueTillCurrentMonth;
});

module.exports = mongoose.model("Fee", feeSchema);
