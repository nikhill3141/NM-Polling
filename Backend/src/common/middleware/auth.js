import User from "../../modules/User/user.model.js";
import { verifyToken } from "../utils/token.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearerToken || req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive || user.isSuspended) {
      return res.status(401).json({
        success: false,
        error: { message: "User is not authorized" },
      });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: { message: "Password changed recently. Please log in again." },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid or expired token" },
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearerToken || req.cookies?.access_token;

    if (token) {
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.userId);
    }
  } catch {
    req.user = null;
  }

  next();
}
