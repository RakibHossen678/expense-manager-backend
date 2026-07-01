import { Income } from './income.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildListFilter, buildPagination, buildPaginationMeta } from '../../helper/utils/queryBuilder.js';

const buildOwnerScope = (userId) => ({
  $or: [{ createdBy: userId }, { createdBy: { $exists: false } }],
});

const buildUserFilter = (userId, query) => ({
  $and: [buildListFilter(query), buildOwnerScope(userId)],
});

const getAll = async (userId, query) => {
  const filter = buildUserFilter(userId, query);
  const { page, limit, skip } = buildPagination(query);

  const [items, totalCount] = await Promise.all([
    Income.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Income.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(totalCount, page, limit) };
};

const getById = async (userId, id) => {
  const income = await Income.findOne({ _id: id, ...buildOwnerScope(userId) });
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

const create = async (userId, payload) => {
  return Income.create({ ...payload, createdBy: userId });
};

const update = async (userId, id, payload) => {
  const safePayload = { ...payload };
  delete safePayload.createdBy;

  const income = await Income.findOneAndUpdate({ _id: id, ...buildOwnerScope(userId) }, safePayload, {
    new: true,
    runValidators: true,
  });
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

const remove = async (userId, id) => {
  const income = await Income.findOneAndDelete({ _id: id, ...buildOwnerScope(userId) });
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

export const incomeService = { getAll, getById, create, update, remove };
