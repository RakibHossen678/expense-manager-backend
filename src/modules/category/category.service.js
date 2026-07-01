import { Category } from './category.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildDocumentIdentityFilter, buildPublicId } from '../../helper/utils/publicId.js';

const getAll = async (filter = {}) => {
  return Category.find(filter).sort({ name: 1 });
};

const getById = async (id) => {
  const category = await Category.findOne(buildDocumentIdentityFilter(id));
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const create = async (payload) => {
  return Category.create({
    ...payload,
    publicId: await buildPublicId('category', 'CAT'),
  });
};

const update = async (id, payload) => {
  const safePayload = { ...payload };
  delete safePayload.publicId;

  const category = await Category.findOneAndUpdate(buildDocumentIdentityFilter(id), safePayload, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const remove = async (id) => {
  const category = await Category.findOneAndDelete(buildDocumentIdentityFilter(id));
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

export const categoryService = { getAll, getById, create, update, remove };
