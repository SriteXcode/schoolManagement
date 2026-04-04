const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new Error();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    // Access if user role is allowed OR user is assigned to an allowed cell
    const isAuthorized = roles.includes(req.user.role) || (req.user.schoolCell && roles.includes(req.user.schoolCell));
    
    if (!isAuthorized) {
      return res.status(403).json({ error: "Access denied. Required roles: " + roles.join(", ") });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.id });
      if (user) {
        req.token = token;
        req.user = user;
      }
    }
    next();
  } catch (e) {
    // If auth fails, just proceed without user (treated as public)
    next();
  }
};

module.exports = { auth, authorizeRole, optionalAuth };
