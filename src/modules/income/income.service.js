import { Income } from './income.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildListFilter, buildPagination, buildPaginationMeta } from '../../helper/utils/queryBuilder.js';

const getAll = async (query) => {
  const filter = buildListFilter(query);
  const { page, limit, skip } = buildPagination(query);

  const [items, totalCount] = await Promise.all([
    Income.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Income.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(totalCount, page, limit) };
};

const getById = async (id) => {
  const income = await Income.findById(id);
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

const create = async (payload) => {
  return Income.create(payload);
};

const update = async (id, payload) => {
  const income = await Income.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

const remove = async (id) => {
  const income = await Income.findByIdAndDelete(id);
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

export const incomeService = { getAll, getById, create, update, remove };
