const jwt = require('jsonwebtoken');
const {
    errorResponse,
    successResponse
} = require('../../util/response');

const jwtSecretKey = process.env.JWT_SECRET;

exports.getLogOutController = async (req, res, next) => {
    try {
        
        const authHeader = req.get('Authorization');

        if (!authHeader) {
            return errorResponse(res, "Not authenticated: Missing Authorization header", {}, 401)
        }

        // ✅ Extract the token from "Bearer <token>"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return errorResponse(res, "Not authenticated: Token missing", {}, 401)
        }

        // ✅ Verify the token
        const decodedToken = jwt.verify(token, jwtSecretKey);

        if (!decodedToken) {
            return errorResponse(res, "Not authenticated: Invalid token", {}, 401)
        }

        // ✅ Respond to client
        return successResponse(res, "User logged out successfully!")

    } catch (error) {
        // If token is expired or invalid
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, "Token has expired. Please log in again", {}, 401)
        }

        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, "Invalid token. Please log in again", {}, 401)
        }

        next(error);
    }
};