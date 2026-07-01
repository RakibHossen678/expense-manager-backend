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

const nameField = body('name')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 80 })
  .withMessage('Name must be 80 characters or fewer');

export const authValidation = {
  register: [nameField, emailField, passwordField],
  login: [emailField, passwordField],
};
