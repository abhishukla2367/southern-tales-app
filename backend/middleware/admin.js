/**
 * Middleware to restrict access to Admin users only.
 * IMPORTANT: This must be used AFTER authMiddleware.
 */
exports.adminMiddleware = (req, res, next) => {
    // 1. Check if the user object exists (set by authMiddleware)
    // 2. Check if the user has admin privileges
    if (req.user && (req.user.isAdmin === true || req.user.role === 'admin')) {
        return next(); // User is admin, proceed to the controller
    }

    // 3. If the user is logged in but not an admin, return 403 Forbidden
    return res.status(403).json({ 
        message: "Access Denied: Admin privileges required." 
    });
};
