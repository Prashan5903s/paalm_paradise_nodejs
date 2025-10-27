const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../../model/BlacklistedToken');
const {
    errorResponse,
    successResponse
} = require('../../util/response');
const jwtSecretKey = process.env.JWT_SECRET;

exports.getLogOutController = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return errorResponse(res, "Not authenticated: Missing Authorization header", {}, 404)
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return errorResponse(res, "Not authenticated: Token missing", {}, 404)
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecretKey);

        // Save to blacklist
        const expiresAt = new Date(decoded.exp * 1000); // convert exp (seconds) to ms

        await BlacklistedToken.create({
            token,
            expiresAt
        });

        return successResponse(res, "User logged out successfully")

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, "Token already expired", {}, 404)
        }
        next(err);
    }
};