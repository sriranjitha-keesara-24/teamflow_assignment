const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const authLimiter = require("../middleware/rateLimiter");

const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/authValidator");

router.post("/register", authLimiter, registerValidator, validateRequest, register);
router.post("/login", authLimiter, loginValidator, validateRequest, login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAllDevices);
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidator,
  validateRequest,
  forgotPassword
);
router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  validateRequest,
  resetPassword
);
router.get("/verify-email/:token", verifyEmail);
router.get("/me", protect, getMe);

module.exports = router;
