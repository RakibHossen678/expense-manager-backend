import { Router } from 'express';
import { query } from 'express-validator';
import { validateRequest } from '../../helper/utils/validateRequest.js';
import { getSummary, getMonthlyBreakdown } from './reports.controller.js';

const router = Router();

router.get(
  '/summary',
  [
    query('preset')
      .optional()
      .isIn(['today', 'week', 'month', 'year', 'custom'])
      .withMessage('preset must be one of: today, week, month, year, custom'),
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
  ],
  validateRequest,
  getSummary
);

router.get(
  '/monthly',
  [query('months').optional().isInt({ min: 1, max: 24 }).withMessage('months must be between 1 and 24')],
  validateRequest,
  getMonthlyBreakdown
);

export default router;
