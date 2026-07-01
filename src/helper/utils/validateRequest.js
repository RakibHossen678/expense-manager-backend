import { validationResult } from 'express-validator';
import { ApiError } from '../../errors/ApiError.js';

/**
 * Place this after an express-validator chain in any route definition:
 *
 *   router.post('/', incomeValidation.create, validateRequest, createIncome);
 *
 * Collects all validation errors and throws a single 400 ApiError with the
 * full list of field-level messages.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ApiError(400, 'Validation failed', details));
  }

  next();
};
