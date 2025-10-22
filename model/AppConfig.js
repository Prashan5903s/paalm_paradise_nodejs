const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
    panic_no: {
        type: String,
        unique: true,
        required: true,
        maxLength: 100
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
