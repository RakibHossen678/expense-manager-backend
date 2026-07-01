import { Router } from 'express';
import { validateRequest } from '../../helper/utils/validateRequest.js';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { budgetValidation } from './budget.validation.js';
import {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from './budget.controller.js';

const router = Router();

router.get('/', budgetValidation.list, validateRequest, getAllBudgets);
router.get('/:id', budgetValidation.getById, validateRequest, getBudgetById);
router.post('/', writeRateLimiter, budgetValidation.create, validateRequest, createBudget);
router.patch('/:id', writeRateLimiter, budgetValidation.update, validateRequest, updateBudget);
router.delete('/:id', writeRateLimiter, budgetValidation.remove, validateRequest, deleteBudget);

export default router;
