import { Router } from 'express';
import { validateRequest } from '../../helper/utils/validateRequest.js';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { incomeValidation } from './income.validation.js';
import {
  getAllIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from './income.controller.js';

const router = Router();

router.get('/', incomeValidation.list, validateRequest, getAllIncome);
router.get('/:id', incomeValidation.getById, validateRequest, getIncomeById);
router.post('/', writeRateLimiter, incomeValidation.create, validateRequest, createIncome);
router.patch('/:id', writeRateLimiter, incomeValidation.update, validateRequest, updateIncome);
router.delete('/:id', writeRateLimiter, incomeValidation.remove, validateRequest, deleteIncome);

export default router;
