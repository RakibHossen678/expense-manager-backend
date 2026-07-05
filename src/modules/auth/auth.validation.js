import { body } from 'express-validator';

const emailField = body('email')
  .trim()
  .isEmail()
  .withMessage('Enter a valid email address')
  .normalizeEmail();

const passwordField = body('password')
  .isString()
  .withMessage('Password is required')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long');

const otpField = body('otp')
  .isString()
  .withMessage('OTP is required')
  .matches(/^\d{6}$/)
  .withMessage('Enter the 6-digit OTP');

const confirmPasswordField = body('confirmPassword')
  .isString()
  .withMessage('Confirm password is required')
  .custom((value, { req }) => value === req.body.password)
  .withMessage('Passwords do not match');

const nameField = body('name')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 80 })
  .withMessage('Name must be 80 characters or fewer');

export const authValidation = {
  register: [nameField, emailField, passwordField],
  login: [emailField, passwordField],
  forgotPassword: [emailField],
  resetPassword: [emailField, otpField, passwordField, confirmPasswordField],
};
