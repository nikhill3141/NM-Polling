import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SERECT_KEY;
  if (!secret) {
    throw new Error("JWT secret is not configured");
  }
  return secret;
};

function createAccessToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });
}

function createRefreshToken(userId) {
  return jwt.sign({ userId, tokenType: "refresh" }, getJwtSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export { createAccessToken, createRefreshToken, verifyToken };
