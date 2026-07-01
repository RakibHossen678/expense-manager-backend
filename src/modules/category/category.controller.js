import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { categoryService } from './category.service.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = type ? { type } : {};
  const categories = await categoryService.getAll(filter);
  sendResponse(res, 200, 'Categories fetched successfully', categories);
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  sendResponse(res, 200, 'Category fetched successfully', category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  sendResponse(res, 201, 'Category created successfully', category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  sendResponse(res, 200, 'Category updated successfully', category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  sendResponse(res, 200, 'Category deleted successfully');
});
