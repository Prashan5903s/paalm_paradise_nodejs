const mongoose = require('mongoose')

const billSchema = new mongoose.Schema({
    bill_data_type: {
        type: String,
        required: true // 1=Utility, 2=Common area, 3=Maintenance
    },
    apartment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "apartments",
        default: null
    },
    bill_type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bill_type",
        default: null
    },
    doc_data: {
        type: String,
        maxLength: 255
    },
    bill_amount: {
        type: Number, // should be number not string
        required: false
    },
    bill_date: {
        type: Date
    },
    bill_due_date: {
        type: Date
    },
    month: {
        type: String,
        maxLength: 255
    },
    year: {
        type: Number // should be number
    },
    payment_due_date: { // ✅ FIXED naming
        type: Date
    },
    additional_cost: [
        {
            title: {
                type: String,
                maxLength: 255
            },
            amount: {
                type: Number
            }
        }
    ],
    status: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    }
})

billSchema.virtual("payments", {
    ref: "Payment",
    localField: "_id",   // Bill._id
    foreignField: "bill_id" // Payment.bill_id
});

billSchema.set("toJSON", { virtuals: true });
billSchema.set("toObject", { virtuals: true });


module.exports = mongoose.model('Bill', billSchema)
