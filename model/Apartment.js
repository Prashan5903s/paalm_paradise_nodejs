const mongoose = require('mongoose')

const apartmentSchema = new mongoose.Schema({
    tower_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "towers"
    },
    floor_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "floors"
    },
    apartment_no: {
        type: Number,
        maxLength: 255,
        required: true
    },
    apartment_area: {
        type: Number,
        maxLength: 255,
        required: true
    },
    apartment_type: {
        type: String,
        maxLength: 255,
        required: true
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        default: null
    },
    status: {
        type: Boolean,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now(),
        required: true
    },
    updated_at: {
        type: Date,
        default: Date.now(),
        required: false
    }
})

apartmentSchema.virtual('user_bills', {
    ref: 'UserBill',
    localField: '_id',
    foreignField: 'apartment_id',
});

apartmentSchema.set('toObject', { virtuals: true });
apartmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('apartments', apartmentSchema)