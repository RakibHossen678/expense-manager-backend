import mongoose from 'mongoose';
import { Category } from './category.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildDocumentIdentityFilter, buildPublicId } from '../../helper/utils/publicId.js';

const asObjectId = (value) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
};

const buildOwnerScope = (userId) => ({
  createdBy: asObjectId(userId),
});

const getAll = async (userId, filter = {}) => {
  return Category.find({ ...filter, ...buildOwnerScope(userId) }).sort({ name: 1 });
};

const getById = async (userId, id) => {
  const category = await Category.findOne({
    $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)],
  });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const create = async (userId, payload) => {
  return Category.create({
    ...payload,
    createdBy: userId,
    publicId: await buildPublicId('category', 'CAT'),
  });
};

const update = async (userId, id, payload) => {
  const safePayload = { ...payload };
  delete safePayload.publicId;
  safePayload.createdBy = userId;

  const category = await Category.findOneAndUpdate(
    { $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)] },
    safePayload,
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

const remove = async (userId, id) => {
  const category = await Category.findOneAndDelete({
    $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)],
  });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

export const categoryService = { getAll, getById, create, update, remove };
