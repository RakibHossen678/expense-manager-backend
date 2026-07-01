import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { budgetService } from './budget.service.js';

export const getAllBudgets = asyncHandler(async (req, res) => {
  const budgets = await budgetService.getAll(req.user.id, req.query);
  sendResponse(res, 200, 'Budgets fetched successfully', budgets);
});

export const getBudgetById = asyncHandler(async (req, res) => {
  const budget = await budgetService.getById(req.user.id, req.params.id);
  sendResponse(res, 200, 'Budget fetched successfully', budget);
});

export const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.create(req.user.id, req.body);
  sendResponse(res, 201, 'Budget created successfully', budget);
});

export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.update(req.user.id, req.params.id, req.body);
  sendResponse(res, 200, 'Budget updated successfully', budget);
});

export const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.remove(req.user.id, req.params.id);
  sendResponse(res, 200, 'Budget deleted successfully');
});
