const jwt = require('jsonwebtoken');
const User = require('../models/User');


const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Malformed token' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
        req.user = decoded;
        next();
    });
};  

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

const checkIfFirstUser = async (req, res, next) => {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            next();
        } else {
            verifyToken(req, res, next);
        }
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
};

module.exports = { verifyToken, restrictTo, checkIfFirstUser };
