const mongoose = require('mongoose')
const Counter = require('../model/Counter')

const complainSchema = new mongoose.Schema({
    happy_code: {
        type: Number,
        required: true,
        maxLength: 6
    },
    complain_no: {
        type: String,
        uinque: true
    },
    assigned_to: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "users"
        },
        remark: {
            type: String,
            required: false,
            maxLength: 5000,
        },
    },
    nature: {
        type: Number,
        required: true
    }, // 1 for Complaint, 2 for suggestion
    complain_type: {
        type: Number,
        required: true
    }, // 1 for individual, 2 for society
    category: {
        type: Number,
        required: true
    }, // 1 for plumbing, 2 for electricity, 3 for leakage, 4 for Internet, 5 for house keeping/guard, 6 for others
    description: {
        type: String,
        required: true,
        maxLength: 5000
    },
    complain_status: {
        type: Number,
        required: true,
        default: 1,
    }, // 1 for Pending, 2 = assigned, 3 for resolved
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "users"
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    updated_at: {
        type: Date,
        required: false
    }
})

complainSchema.pre('save', async function (next) {

    if (this.complain_no) return next(); // Already set

    // Get next sequence
    const counter = await Counter.findByIdAndUpdate(
        'receipt',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const seq = counter.seq;
    const seqPadded = String(seq).padStart(2, '0');

    this.complain_no = `101${seqPadded}`;
    next();
});

module.exports = mongoose.model('complain', complainSchema)