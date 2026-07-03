import { Expense } from './expense.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildDocumentIdentityFilter, buildPublicId } from '../../helper/utils/publicId.js';
import { buildListFilter, buildPagination, buildPaginationMeta } from '../../helper/utils/queryBuilder.js';

const buildOwnerScope = (userId) => ({
  $or: [{ createdBy: userId }, { createdBy: null }],
});

const buildUserFilter = (userId, query) => ({
  $and: [buildListFilter(query), buildOwnerScope(userId)],
});

const getAll = async (userId, query) => {
  const filter = buildUserFilter(userId, query);
  const { page, limit, skip } = buildPagination(query);

  const [items, totalCount] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(totalCount, page, limit) };
};

const getById = async (userId, id) => {
  const expense = await Expense.findOne({ $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)] });
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

const create = async (userId, payload) => {
  return Expense.create({
    ...payload,
    publicId: await buildPublicId('expense', 'EXP'),
    createdBy: userId,
  });
};

const update = async (userId, id, payload) => {
  const safePayload = { ...payload };
  safePayload.createdBy = userId;

  const expense = await Expense.findOneAndUpdate(
    { $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)] },
    safePayload,
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

const remove = async (userId, id) => {
  const expense = await Expense.findOneAndDelete({
    $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)],
  });
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

export const expenseService = { getAll, getById, create, update, remove };
