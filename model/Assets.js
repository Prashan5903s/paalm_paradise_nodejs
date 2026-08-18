const mongoose = require('mongoose')

const assetSchema = new mongoose.Schema(
  {
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'vendor'
    },
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'asset_location'
    },
    asset_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'asset_category',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: String,
    model: String,
    serial_number: {
      type: String,
      unique: true,
      sparse: true
    },
    purchase_date: Date,
    purchase_cost: Number,
    warranty_start: Date,
    warranty_end: Date,
    qr_code: String,
    bar_code: String,
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Maintenance', 'Disposed'],
      default: 'Active'
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Good'
    },
    depreciationValue: Number,
    images: [String],
    documents: [String],
    description: String,
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: false,
      default: null
    }
  },
  {
    collection: 'assets',
    timestamps: true
  }
)

module.exports = mongoose.model('assets', assetSchema)
