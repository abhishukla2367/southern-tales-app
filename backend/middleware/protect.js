const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.id || decoded._id;

      req.user = {
        id: userId,        // ✅ For controllers using req.user.id
        _id: userId,       // ✅ For controllers using req.user._id
        role: decoded.role,
        isAdmin: decoded.isAdmin,
      };

      return next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.isAdmin === true)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
};

module.exports = { protect, admin };