const mongoose = require('mongoose')
const Counter = require('../model/Counter')

const UserBillSchema = new mongoose.Schema({
    bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Bill"
    },
    apartment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "apartments"
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users"
    },
    receipt_no: {
        type: String,
        unique: true
    },
    amount: {
        type: Number,
        required: false,
        default: 0,
    },
    bank_name: {
        type: String,
        maxLength: 255
    },
    status: {
        type: String,
        maxLength: 255,
        required: false
    },
    paid_remark: {
        type: String,
        maxLength: 5000
    },
    payment_mode: String,
    neft_no: String,
    neft_date: Date,
    cheque_no: String,
    cheque_date: Date,
    demand_draft_no: String,
    demand_draft_date: Date,
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        required: false,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        required: false,
    }
})

UserBillSchema.pre('save', async function (next) {
    if (this.receipt_no) return next(); // Already set

    // Get next sequence
    const counter = await Counter.findByIdAndUpdate(
        'receipt',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const seq = counter.seq;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const seqPadded = String(seq).padStart(6, '0');

    this.receipt_no = `RCPT-${dateStr}-${seqPadded}`;
    next();
});

UserBillSchema.virtual("bill", {
    ref: "Bill",
    localField: "bill_id",
    foreignField: "_id",
    justOne: true
});

UserBillSchema.set("toJSON", { virtuals: true });
UserBillSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("user_bill", UserBillSchema)