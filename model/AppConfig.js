const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
    panic_no: {
        type: String,
        maxLength: 100
    },
    type: {
        type: String,
        maxLength: 11
    },
    terms_condition: {
        type: String,
        maxLength: 5000
    },
    dpa: {
        type: String,
        maxLength: 5000
    },
    terms_of_use: {
        type: String,
        maxLength: 5000
    },
    privacy_policy: {
        type: String,
        maxLength: 5000
    },
    annouc_banner: {
        type: String,
        required: false,
        maxLength: 100
    },
}, {
    collection: 'app_config'
});

module.exports = mongoose.model('app_config', appConfigSchema);