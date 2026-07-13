import { body, param, query } from 'express-validator';

const titleRule = body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required')
  .isLength({ max: 100 })
  .withMessage('Title must be 100 characters or fewer');

const amountRule = body('amount')
  .notEmpty()
  .withMessage('Amount is required')
  .isFloat({ gt: 0 })
  .withMessage('Amount must be greater than 0');

// Only validates shape here (non-empty, reasonable length). Whether the
// category actually exists (fixed list OR a custom category the user
// created) is checked by the Mongoose schema validator in income.model.js,
// since that's the layer with DB access to check custom categories — a
// static isIn() here would incorrectly reject valid custom categories.
const categoryRule = body('category')
  .trim()
  .notEmpty()
  .withMessage('Category is required')
  .isLength({ max: 40 })
  .withMessage('Category name is too long');

const monthRule = body('month')
  .notEmpty()
  .withMessage('Month is required')
  .isInt({ min: 1, max: 12 })
  .withMessage('Month must be between 1 and 12');

const yearRule = body('year')
  .notEmpty()
  .withMessage('Year is required')
  .isInt({ min: 2000, max: 2100 })
  .withMessage('Year must be a valid year');

const dateRule = query('date')
  .optional()
  .isISO8601({ strict: true })
  .withMessage('Date must be a valid date');

const startDateRule = query('startDate')
  .optional()
  .isISO8601({ strict: true })
  .withMessage('startDate must be a valid date');

const endDateRule = query('endDate')
  .optional()
  .isISO8601({ strict: true })
  .withMessage('endDate must be a valid date');

const descriptionRule = body('description')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 500 })
  .withMessage('Description must be 500 characters or fewer');

const notesRule = body('notes')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 500 })
  .withMessage('Notes must be 500 characters or fewer');

const idParamRule = param('id')
  .trim()
  .notEmpty()
  .withMessage('Invalid income id')
  .matches(/^(?:[A-Z]{2,5}\d+|[0-9a-fA-F]{24})$/)
  .withMessage('Invalid income id');

export const incomeValidation = {
  create: [titleRule, amountRule, categoryRule, monthRule, yearRule, descriptionRule, notesRule],
  update: [
    idParamRule,
    titleRule.optional(),
    amountRule.optional(),
    categoryRule.optional(),
    monthRule.optional(),
    yearRule.optional(),
    descriptionRule,
    notesRule,
  ],
  remove: [idParamRule],
  getById: [idParamRule],
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().trim().isLength({ max: 40 }),
    dateRule,
    startDateRule,
    endDateRule,
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
    query('minAmount').optional().isFloat({ min: 0 }).withMessage('minAmount must be a positive number'),
    query('maxAmount').optional().isFloat({ min: 0 }).withMessage('maxAmount must be a positive number'),
  ],
};
