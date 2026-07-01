import { Router } from 'express';
import { validateRequest } from '../../helper/utils/validateRequest.js';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { categoryValidation } from './category.validation.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.controller.js';

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', categoryValidation.getById, validateRequest, getCategoryById);
router.post('/', writeRateLimiter, categoryValidation.create, validateRequest, createCategory);
router.patch('/:id', writeRateLimiter, categoryValidation.update, validateRequest, updateCategory);
router.delete('/:id', writeRateLimiter, categoryValidation.remove, validateRequest, deleteCategory);

export default router;
