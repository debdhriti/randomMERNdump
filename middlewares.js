require('dotenv').config()

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(200).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(200).json({ message: 'User not logged in' });
        }

        req.user = decoded;
        next();
    });
}

module.exports = authenticateToken;