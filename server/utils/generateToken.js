const jwt = require("jsonwebtoken");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
} = require("../config/env");

// Short-lived token used to authenticate normal requests
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES,
  });
};

// Long-lived token used only to get a new access token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
