import { Router } from 'express';
import { validateRequest } from '../../helper/utils/validateRequest.js';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { expenseValidation } from './expense.validation.js';
import {
  getAllExpense,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from './expense.controller.js';

const router = Router();

router.get('/', expenseValidation.list, validateRequest, getAllExpense);
router.get('/:id', expenseValidation.getById, validateRequest, getExpenseById);
router.post('/', writeRateLimiter, expenseValidation.create, validateRequest, createExpense);
router.patch('/:id', writeRateLimiter, expenseValidation.update, validateRequest, updateExpense);
router.delete('/:id', writeRateLimiter, expenseValidation.remove, validateRequest, deleteExpense);

export default router;
