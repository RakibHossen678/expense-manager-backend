import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { incomeService } from './income.service.js';

export const getAllIncome = asyncHandler(async (req, res) => {
  const { items, meta } = await incomeService.getAll(req.query);
  sendResponse(res, 200, 'Income fetched successfully', items, meta);
});

export const getIncomeById = asyncHandler(async (req, res) => {
  const income = await incomeService.getById(req.params.id);
  sendResponse(res, 200, 'Income entry fetched successfully', income);
});

export const createIncome = asyncHandler(async (req, res) => {
  const income = await incomeService.create(req.body);
  sendResponse(res, 201, 'Income entry created successfully', income);
});

export const updateIncome = asyncHandler(async (req, res) => {
  const income = await incomeService.update(req.params.id, req.body);
  sendResponse(res, 200, 'Income entry updated successfully', income);
});

export const deleteIncome = asyncHandler(async (req, res) => {
  await incomeService.remove(req.params.id);
  sendResponse(res, 200, 'Income entry deleted successfully');
});
