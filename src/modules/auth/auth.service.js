import { ApiError } from '../../errors/ApiError.js';
import { buildPublicId } from '../../helper/utils/publicId.js';
import { createAuthToken } from '../../helper/utils/authToken.js';
import crypto from 'node:crypto';
import { sendMail } from '../../helper/utils/mailer.js';
import { User } from './user.model.js';

const sanitizeUser = (user) => ({
  id: user.publicId || user._id.toString(),
  name: user.name || '',
  email: user.email,
  tokenVersion: user.tokenVersion,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const OTP_TTL_MINUTES = 15;
const OTP_LENGTH = 6;

const generateOtp = () => String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const buildOtpEmail = ({ name, otp }) => ({
  subject: 'Your Expense Manager password reset OTP',
  text: `Hello ${name || 'there'}, your password reset OTP is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  html: `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">Password reset OTP</h2>
      <p>Hello ${name || 'there'},</p>
      <p>Your one-time password is:</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;padding:16px 18px;border:1px solid #d1d5db;border-radius:12px;display:inline-block">${otp}</div>
      <p style="margin-top:16px">It expires in ${OTP_TTL_MINUTES} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `,
});

const register = async ({ name = '', email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const user = new User({
    publicId: await buildPublicId('user', 'USR'),
    name,
    email,
  });
  user.setPassword(password);

  await user.save();

  return {
    user: sanitizeUser(user),
    token: createAuthToken({
      userId: user._id,
      tokenVersion: user.tokenVersion,
    }),
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !user.verifyPassword(password)) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return {
    user: sanitizeUser(user),
    token: createAuthToken({
      userId: user._id,
      tokenVersion: user.tokenVersion,
    }),
  };
};

const me = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
};

const logout = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.tokenVersion += 1;
  await user.save();

  return true;
};

const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    return {
      message: 'If an account exists for that email, an OTP has been sent',
    };
  }

  const otp = generateOtp();
  user.passwordResetOtpHash = hashOtp(otp);
  user.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await user.save();

  const { subject, text, html } = buildOtpEmail({ name: user.name, otp });
  try {
    await sendMail({
      to: user.email,
      subject,
      text,
      html,
    });
  } catch (error) {
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    await user.save();
    throw error;
  }

  return {
    message: 'If an account exists for that email, an OTP has been sent',
  };
};

const resetPassword = async ({ email, otp, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash +passwordResetOtpHash +passwordResetOtpExpiresAt');

  if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
    throw new ApiError(400, 'OTP is invalid or expired');
  }

  if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    await user.save();
    throw new ApiError(400, 'OTP is invalid or expired');
  }

  if (hashOtp(otp) !== user.passwordResetOtpHash) {
    throw new ApiError(400, 'OTP is invalid or expired');
  }

  user.setPassword(password);
  user.passwordResetOtpHash = null;
  user.passwordResetOtpExpiresAt = null;
  user.tokenVersion += 1;
  await user.save();

  return true;
};

export const authService = {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
};
