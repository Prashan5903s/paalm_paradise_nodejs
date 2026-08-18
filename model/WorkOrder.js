const mongoose = require('mongoose')

const WorkOrderSchema = new mongoose.Schema(
  {
    work_order_no: {
      type: String,
      unique: true
    },
    asset_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'assets'
    },
    type: {
      type: String,
      enum: ['Repair', 'Maintenance', 'Inspection', 'Installation']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Open'
    },
    description: String,
    estimatedCost: Number,
    actualCost: Number,
    completedAt: Date,
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
    collection: 'work_order',
    timestamps: true
  }
)

module.exports = mongoose.model('work_order', WorkOrderSchema)
