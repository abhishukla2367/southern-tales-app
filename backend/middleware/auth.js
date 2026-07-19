const jwt = require('jsonwebtoken');

/**
 * @desc    Middleware to protect routes
 * Satisfies Task 4 & 6: Only logged-in users can access specific routes
 */
const protect = (req, res, next) => {
    let token;

    // 1. Check for token in the Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Normalize User Object (Standardizes req.user.id for all controllers)
            req.user = {
                id: decoded.id || decoded._id,
                role: decoded.role || "user"
            };

            return next(); // ✅ Add 'return' to prevent execution of code below
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    // 4. If no token was found at all
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
    }
};

/**
 * @desc    Middleware to restrict access to Admins only
 * Satisfies Task 8.3: Admin side Orders & Reservations pages
 */
const admin = (req, res, next) => {
    // Matches the normalized 'role' from the protect middleware
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied: Admin privileges required" });
    }
};

module.exports = { protect, admin };
