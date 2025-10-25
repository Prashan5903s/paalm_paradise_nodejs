const jwt = require('jsonwebtoken')
const jwtSecretKey = process.env.JWT_SECRET

module.exports = (req, res, next) => {
    try {
        const authHeader = req.get('Authorization')

        if (!authHeader) {
            return res.status(401).json({ message: 'Not authenticated: Missing Authorization header' })
        }

        // Extract token
        const token = authHeader.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated: Token missing' })
        }

        // Verify token
        let decodedToken
        try {
            decodedToken = jwt.verify(token, jwtSecretKey)
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' })
        }

        if (!decodedToken) {
            return res.status(401).json({ message: 'Not authenticated: Invalid token' })
        }

        // Attach user info
        req.userId = decodedToken.userId
        req.user = decodedToken
        req.user._id = req.userId

        next()
    } catch (err) {
        console.error('Auth middleware error:', err.message)
        res.status(500).json({ message: 'Server authentication error' })
    }
}
