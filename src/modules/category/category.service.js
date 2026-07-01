import { Category } from './category.model.js';
import { ApiError } from '../../errors/ApiError.js';

const getAll = async (filter = {}) => {
  return Category.find(filter).sort({ name: 1 });
};

const getById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const create = async (payload) => {
  return Category.create(payload);
};

const update = async (id, payload) => {
  const category = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const remove = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

export const categoryService = { getAll, getById, create, update, remove };
