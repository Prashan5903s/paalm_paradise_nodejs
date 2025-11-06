require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../model/User');
const jwtSecretKey = process.env.JWT_SECRET;
const validate = require('../../util/validation');
const expireTime = process.env.token_expire_time;
const { hash, normalizeEmail, decrypt } = require('../../util/encryption');

exports.postAPILogIn = async (req, res, next) => {
    try {
        // ✅ Validate input first
        if (!validate(req, res)) return;

        const { email, password, fcm_token } = req.body;

        // ✅ Normalize email and find user
        const user = await User.findOne({ email: normalizeEmail(email) });
        if (!user) {
            const error = new Error("A user with this email cannot be found!");
            error.statusCode = 401;
            throw error;
        }

        if (!user.status) {
            const error = new Error("Your account is deactivated!");
            error.statusCode = 400;
            throw error;
        }

        // ✅ Check password
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error("Wrong password");
            error.statusCode = 401;
            throw error;
        }

        // ✅ Update FCM token if provided (optional, no error if missing)
        if (fcm_token && fcm_token.trim() !== "") {
            user.fcm_token = fcm_token;
            user.save().catch(err => console.error("⚠️ FCM token update failed:", err));
        }

        // ✅ Generate JWT token
        const expiresInSeconds = expireTime * 60 * 60; // convert hours to seconds
        const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString(),
            },
            jwtSecretKey,
            { expiresIn: `${expireTime}h` }
        );

        // ✅ Send response
        res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "User logged in successfully!",
            token: token,
            expiresAt: expirationTimestamp,
            userId: user._id.toString(),
            email: decrypt(user.email),
            photo: user.photo,
            neighbour_data: user.neighbour_data,
            friend_data: user?.friend_relative_data,
            name: `${user.first_name} ${user.last_name}`,
        });

    } catch (err) {
        // ✅ Pass any errors to error middleware
        next(err);
    }
};
