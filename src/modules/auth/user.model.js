import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { baseModelPlugin } from '../../utils/baseModelPlugin.js';

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;

const hashPassword = (password, salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString('hex')) => {
  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${salt}:${derivedKey}`;
};

const verifyPassword = (password, storedPassword) => {
  const [salt, expectedHash] = String(storedPassword || '').split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  const actualBuffer = Buffer.from(derivedKey);
  const expectedBuffer = Buffer.from(expectedHash);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const userSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [80, 'Name must be 80 characters or fewer'],
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    passwordResetOtpHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.plugin(baseModelPlugin);

userSchema.methods.setPassword = function setPassword(password) {
  this.passwordHash = hashPassword(password);
};

userSchema.methods.verifyPassword = function checkPassword(password) {
  return verifyPassword(password, this.passwordHash);
};

userSchema.statics.hashPassword = hashPassword;

export const User = mongoose.model('User', userSchema);
