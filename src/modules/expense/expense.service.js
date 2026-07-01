import { Expense } from './expense.model.js';
import { ApiError } from '../../errors/ApiError.js';
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
  const expense = await Expense.findOne({ _id: id, ...buildOwnerScope(userId) });
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

const create = async (userId, payload) => {
  return Expense.create({ ...payload, createdBy: userId });
};

const update = async (userId, id, payload) => {
  const safePayload = { ...payload };
  delete safePayload.createdBy;

  const expense = await Expense.findOneAndUpdate({ _id: id, ...buildOwnerScope(userId) }, safePayload, {
    new: true,
    runValidators: true,
  });
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

const remove = async (userId, id) => {
  const expense = await Expense.findOneAndDelete({ _id: id, ...buildOwnerScope(userId) });
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

export const expenseService = { getAll, getById, create, update, remove };
