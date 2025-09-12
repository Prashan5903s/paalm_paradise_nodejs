const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
    bill_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bill",   // ✅ Relation with Bill model
        required: true
    },
    amount: {
        type: Number,  // ✅ Better as Number, not String
        required: true
    },
    bank_name: {
        type: String,
        maxLength: 255
    },
    status: {
        type: String,
        maxLength: 255,
        required: true
    },
    paid_remark: {
        type: String,
        maxLength: 5000
    },
    neft_no: String,
    neft_date: Date, // ✅ Date instead of string
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
        default: Date.now
    }
})

module.exports = mongoose.model('Payment', paymentSchema)
