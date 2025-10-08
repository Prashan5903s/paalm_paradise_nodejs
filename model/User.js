const mongoose = require("mongoose");
const {
    Schema,
    Types
} = mongoose;

const userSchema = new Schema({
    company_id: {
        type: Schema.Types.Mixed,
        required: true,
        ref: "users",
        validate: {
            validator: (v) => Types.ObjectId.isValid(v) || typeof v === "number",
            message: (props) =>
                `${props.value} is not a valid ObjectId or number`,
        },
    },
    first_name: {
        type: String,
        required: true,
        maxlength: 255,
    },
    last_name: {
        type: String,
        maxlength: 255,
        required: true,
    },
    company_name: {
        type: String,
        maxlength: 255,
        required: false,
    },
    user_type: {
        type: String,
        maxlength: 255,
        required: false,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        maxlength: 255,
        required: true,
    },
    phone: {
        type: String,
    },
    status: {
        type: Boolean,
        default: 0,
    },
    address: {
        type: String,
        maxlength: 4000,
        required: false,
    },
    package_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    pincode: {
        type: String,
        required: false,

        maxlength: 10,
    },
    country_id: {
        type: String,
        ref: "countries",
        required: false,
    },
    state_id: {
        type: String,
        required: false,
    },
    city_id: {
        type: String,
        required: false,
    },
    tower_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    floor_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    apartment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    photo: {
        type: String,
    },
    cameras: [{
        title: {
            type: String,
            required: true,
            maxlength: 255,
        },
        ip: {
            type: String,
            required: true,
            maxlength: 5000,
            validate: {
                validator: function (v) {
                    // Basic URL check (http/https)
                    return /^https?:\/\/.+/.test(v);
                },
                message: (props) => `${props.value} is not a valid camera URL`,
            },
        },
    }, ],
    tenant_data: {
        apartment_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "apartment"
        },
        contact_start_date: {
            type: String,
            required: false
        },
        contact_end_date: {
            type: String,
            required: false
        },
        move_in_date: {
            type: String,
            required: false
        },
        move_out_date: {
            type: String,
            required: false
        },
        rent_billing_cycle: {
            type: String,
            required: false
        },
        rent_amount: {
            type: String,
            required: false
        }
    },
    apartment_data: [{
        tower_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        floor_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        apartment_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        }
    }, ],
    qnap_username: {
        type: String,
        required: false,
        maxlength: 255,
    },
    qnap_password: {
        type: String,
        required: false,
        maxlength: 255,
    },
    sip_extension: {
        type: String,
        required: false,
        maxlength: 255,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    deleted_at: {
        type: Date,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: false,
    },
    master_company_id: {
        type: Schema.Types.Mixed,
        ref: "users",
        required: true,
        validate: {
            validator: (v) => Types.ObjectId.isValid(v) || typeof v === "number",
            message: (props) =>
                `${props.value} is not a valid ObjectId or number`,
        },
    },
    parent_company_id: {
        type: Schema.Types.Mixed,
        ref: "users",
        required: true,
        validate: {
            validator: (v) => Types.ObjectId.isValid(v) || typeof v === "number",
            message: (props) =>
                `${props.value} is not a valid ObjectId or number`,
        },
    },
    dob: {
        type: Date,
        required: false,
    },
});

// ✅ Virtual for employee ID
userSchema.virtual("emp_id").get(function () {
    const activeCodeObj = (this.codes || []).find(
        (code) => code.type === "active"
    );
    return activeCodeObj?.code || null;
});

// ✅ Virtual population for roles
userSchema.virtual("roles", {
    ref: "role_user",
    localField: "_id",
    foreignField: "user_id",
    justOne: false,
});

// ✅ Enable virtuals in JSON / Object
userSchema.set("toJSON", {
    virtuals: true,
    getters: true,
});
userSchema.set("toObject", {
    virtuals: true,
    getters: true,
});

module.exports = mongoose.model("users", userSchema);