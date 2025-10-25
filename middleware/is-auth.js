const jwt = require('jsonwebtoken');

// optional: in-memory blacklist (use Redis or DB in production)
const blacklistedTokens = new Set();

exports.postLogOutController = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                message: 'Authorization header missing'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Token missing'
            });
        }

        // Add this token to blacklist so it can’t be reused
        blacklistedTokens.add(token);

        return res.status(200).json({
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// expose the blacklist for middleware
exports.blacklistedTokens = blacklistedTokens;