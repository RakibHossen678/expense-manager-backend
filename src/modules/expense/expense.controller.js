import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { expenseService } from './expense.service.js';

export const getAllExpense = asyncHandler(async (req, res) => {
  const { items, meta } = await expenseService.getAll(req.query);
  sendResponse(res, 200, 'Expense fetched successfully', items, meta);
});

export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getById(req.params.id);
  sendResponse(res, 200, 'Expense entry fetched successfully', expense);
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.create(req.body);
  sendResponse(res, 201, 'Expense entry created successfully', expense);
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.update(req.params.id, req.body);
  sendResponse(res, 200, 'Expense entry updated successfully', expense);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.remove(req.params.id);
  sendResponse(res, 200, 'Expense entry deleted successfully');
});
