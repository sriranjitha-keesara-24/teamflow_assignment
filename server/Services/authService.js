const crypto = require('crypto');
const User = require('../models/User');
const { generateTokenPair } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const { ApiError } = require('../middleware/errorMiddleware');
const env = require('../config/env');

/**
 * Register a new user and return token pair.
 */
const registerUser = async ({ name, email, password }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError('An account with this email already exists', 400);
  }

  const user = await User.create({ name, email, password });

  const tokens = generateTokenPair(user._id);

  // Store refresh token
  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: tokens.refreshToken },
  });

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;

  return { user: userResponse, ...tokens };
};

/**
 * Authenticate user and return token pair.
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new ApiError(
      'Your account has been deactivated. Contact an administrator.',
      403
    );
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }

  const tokens = generateTokenPair(user._id);

  // Store refresh token (keep last 5 sessions)
  let refreshTokens = user.refreshTokens || [];
  refreshTokens.push(tokens.refreshToken);
  if (refreshTokens.length > 5) {
    refreshTokens = refreshTokens.slice(-5);
  }
  await User.findByIdAndUpdate(user._id, { refreshTokens });

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;

  return { user: userResponse, ...tokens };
};

/**
 * Generate password reset token and send email.
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether email exists
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  await User.findByIdAndUpdate(user._id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpire: Date.now() + 30 * 60 * 1000, // 30 minutes
  });

  // Send email with reset link
  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

  console.log('\n==================================================');
  console.log(`🔑 PASSWORD RESET LINK GENERATED FOR: ${user.email}`);
  console.log(`🔗 RESET URL: ${resetUrl}`);
  console.log('==================================================\n');

  await sendEmail({
    to: user.email,
    subject: 'TeamFlow — Password Reset Request',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the button below to create a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 30 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Reset password using token.
 */
const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    throw new ApiError('Invalid or expired reset token', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  return { message: 'Password reset successful. Please log in again.' };
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };
