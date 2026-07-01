import { body, param } from 'express-validator';

const nameRule = body('name')
  .trim()
  .notEmpty()
  .withMessage('Name is required')
  .isLength({ max: 40 })
  .withMessage('Name must be 40 characters or fewer');

const typeRule = body('type')
  .trim()
  .notEmpty()
  .withMessage('Type is required')
  .isIn(['income', 'expense'])
  .withMessage('Type must be either "income" or "expense"');

const idParamRule = param('id').isMongoId().withMessage('Invalid category id');

export const categoryValidation = {
  create: [nameRule, typeRule],
  update: [idParamRule, nameRule.optional(), typeRule.optional()],
  remove: [idParamRule],
  getById: [idParamRule],
};
