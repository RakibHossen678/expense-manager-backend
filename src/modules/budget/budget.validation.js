import { body, param, query } from 'express-validator';

// Only validates shape. Actual category correctness (fixed list OR
// custom) is checked by the Mongoose schema validator in budget.model.js.
const categoryRule = body('category')
  .optional({ values: 'null' })
  .trim()
  .isLength({ max: 40 })
  .withMessage('Category name is too long');

const amountRule = body('amount')
  .notEmpty()
  .withMessage('Amount is required')
  .isFloat({ gt: 0 })
  .withMessage('Amount must be greater than 0');

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

const idParamRule = param('id')
  .trim()
  .notEmpty()
  .withMessage('Invalid budget id')
  .matches(/^(?:[A-Z]{2,5}\d+|[0-9a-fA-F]{24})$/)
  .withMessage('Invalid budget id');

export const budgetValidation = {
  create: [categoryRule, amountRule, monthRule, yearRule],
  update: [idParamRule, categoryRule, amountRule.optional(), monthRule.optional(), yearRule.optional()],
  remove: [idParamRule],
  getById: [idParamRule],
  list: [
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
  ],
};
