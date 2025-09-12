const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    cost_type: {
        type: String,
        required: true // "1" for fixed value, "2" for unit type
    },
    fixed_data: [
        {
            apartment_type: {
                type: String,
                required: false
            },
            unit_value: {
                type: String,
                required: false
            }
        }
    ],
    unit_type: {
        unit_name: {
            type: String,
            required: false
        },
        unit_value: {
            type: Number,
            required: false
        }
    }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
