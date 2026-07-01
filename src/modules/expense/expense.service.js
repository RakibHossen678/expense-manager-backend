import { Expense } from './expense.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildListFilter, buildPagination, buildPaginationMeta } from '../../helper/utils/queryBuilder.js';

const getAll = async (query) => {
  const filter = buildListFilter(query);
  const { page, limit, skip } = buildPagination(query);

  const [items, totalCount] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(totalCount, page, limit) };
};

const getById = async (id) => {
  const expense = await Expense.findById(id);
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

const create = async (payload) => {
  return Expense.create(payload);
};

const update = async (id, payload) => {
  const expense = await Expense.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

const remove = async (id) => {
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return expense;
};

export const expenseService = { getAll, getById, create, update, remove };
