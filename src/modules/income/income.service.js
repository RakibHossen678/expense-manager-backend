import { Income } from './income.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildDocumentIdentityFilter, buildPublicId } from '../../helper/utils/publicId.js';
import { buildPagination, buildPaginationMeta } from '../../helper/utils/queryBuilder.js';

const buildOwnerScope = (userId) => ({
  $or: [{ createdBy: userId }, { createdBy: null }],
});

const normalizeIncomePayload = (payload) => {
  const normalized = { ...payload };

  if (normalized.month !== undefined && normalized.month !== null && normalized.month !== '') {
    normalized.month = Number(normalized.month);
  }

  if (normalized.year !== undefined && normalized.year !== null && normalized.year !== '') {
    normalized.year = Number(normalized.year);
  }

  if (normalized.date) {
    const date = new Date(normalized.date);
    if (!Number.isNaN(date.getTime())) {
      normalized.month = date.getMonth() + 1;
      normalized.year = date.getFullYear();
    }
  }

  delete normalized.date;

  return normalized;
};

const buildIncomeListFilter = (query) => {
  const { search, category, month, year, minAmount, maxAmount } = query;
  const andConditions = [];

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    andConditions.push({ $or: [{ title: regex }, { category: regex }, { notes: regex }] });
  }

  if (category) {
    andConditions.push({ category });
  }

  const hasMonth = month !== undefined && month !== null && month !== '';
  const hasYear = year !== undefined && year !== null && year !== '';
  if (hasMonth && hasYear) {
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    if (Number.isInteger(monthNumber) && Number.isInteger(yearNumber)) {
      andConditions.push({
        $or: [
          { month: monthNumber, year: yearNumber },
          {
            date: {
              $gte: new Date(yearNumber, monthNumber - 1, 1),
              $lt: new Date(yearNumber, monthNumber, 1),
            },
          },
        ],
      });
    }
  }

  if (minAmount || maxAmount) {
    const amountFilter = {};
    if (minAmount) amountFilter.$gte = Number(minAmount);
    if (maxAmount) amountFilter.$lte = Number(maxAmount);
    andConditions.push({ amount: amountFilter });
  }

  return andConditions.length ? { $and: andConditions } : {};
};

const buildUserFilter = (userId, query) => ({
  $and: [buildIncomeListFilter(query), buildOwnerScope(userId)],
});

const getAll = async (userId, query) => {
  const filter = buildUserFilter(userId, query);
  const { page, limit, skip } = buildPagination(query);

  const [items, totalCount] = await Promise.all([
    Income.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).skip(skip).limit(limit),
    Income.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(totalCount, page, limit) };
};

const getById = async (userId, id) => {
  const income = await Income.findOne({ $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)] });
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

const create = async (userId, payload) => {
  return Income.create({
    ...normalizeIncomePayload(payload),
    publicId: await buildPublicId('income', 'INC'),
    createdBy: userId,
  });
};

const update = async (userId, id, payload) => {
  const safePayload = normalizeIncomePayload(payload);
  safePayload.createdBy = userId;
  delete safePayload.publicId;

  const income = await Income.findOneAndUpdate(
    { $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)] },
    safePayload,
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

const remove = async (userId, id) => {
  const income = await Income.findOneAndDelete({
    $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)],
  });
  if (!income) {
    throw new ApiError(404, 'Income entry not found');
  }
  return income;
};

export const incomeService = { getAll, getById, create, update, remove };
