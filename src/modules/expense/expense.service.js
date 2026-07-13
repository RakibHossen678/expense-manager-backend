import mongoose from 'mongoose';
import { Expense } from './expense.model.js';
import { ApiError } from '../../errors/ApiError.js';
import { buildDocumentIdentityFilter, buildPublicId } from '../../helper/utils/publicId.js';
import { buildPagination, buildPaginationMeta } from '../../helper/utils/queryBuilder.js';

const buildOwnerScope = (userId) => ({
  $or: [{ createdBy: userId }, { createdBy: null }],
});

const parseDateInput = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeExpenseDoc = (doc) => {
  if (!doc) return doc;

  const normalized = { ...doc };
  normalized.id = normalized.publicId || normalized._id?.toString?.() || normalized.id;

  if ((!normalized.month || !normalized.year) && normalized.date) {
    const date = new Date(normalized.date);
    if (!Number.isNaN(date.getTime())) {
      normalized.month = normalized.month || date.getMonth() + 1;
      normalized.year = normalized.year || date.getFullYear();
    }
  }

  delete normalized._id;
  return normalized;
};

const normalizeExpensePayload = (payload) => {
  const normalized = { ...payload };

  if (normalized.month !== undefined && normalized.month !== null && normalized.month !== '') {
    normalized.month = Number(normalized.month);
  }

  if (normalized.year !== undefined && normalized.year !== null && normalized.year !== '') {
    normalized.year = Number(normalized.year);
  }

  if (payload.date) {
    const date = new Date(payload.date);
    if (!Number.isNaN(date.getTime())) {
      normalized.month = normalized.month || date.getMonth() + 1;
      normalized.year = normalized.year || date.getFullYear();
      normalized.date = normalized.date || date;
    }
  }

  return normalized;
};

const buildExpenseListFilter = (query) => {
  const { search, category, startDate, endDate, month, year, minAmount, maxAmount } = query;
  const andConditions = [];

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    andConditions.push({ $or: [{ title: regex }, { category: regex }, { notes: regex }] });
  }

  if (category) {
    andConditions.push({ category });
  }

  if (startDate || endDate) {
    const start = startDate ? parseDateInput(startDate) : null;
    const end = endDate ? parseDateInput(endDate) : null;
    if (start || end) {
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      andConditions.push({
        date: {
          ...(start ? { $gte: start } : {}),
          ...(end ? { $lte: end } : {}),
        },
      });
    }
  }

  const hasMonth = month !== undefined && month !== null && month !== '';
  const hasYear = year !== undefined && year !== null && year !== '';
  if (hasMonth && hasYear) {
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    if (Number.isInteger(monthNumber) && Number.isInteger(yearNumber)) {
      const start = new Date(yearNumber, monthNumber - 1, 1);
      const end = new Date(yearNumber, monthNumber, 1);
      andConditions.push({
        $or: [
          { month: monthNumber, year: yearNumber },
          {
            $and: [
              {
                $or: [
                  { month: mongoose.trusted({ $exists: false }) },
                  { year: mongoose.trusted({ $exists: false }) },
                ],
              },
              { date: mongoose.trusted({ $gte: start, $lt: end }) },
            ],
          },
        ],
      });
    }
  }

  if (minAmount || maxAmount) {
    const amountFilter = {};
    if (minAmount) amountFilter.$gte = Number(minAmount);
    if (maxAmount) amountFilter.$lte = Number(maxAmount);
    andConditions.push({ amount: mongoose.trusted(amountFilter) });
  }

  return andConditions.length ? { $and: andConditions } : {};
};

const buildUserFilter = (userId, query) => ({
  $and: [buildExpenseListFilter(query), buildOwnerScope(userId)],
});

const getAll = async (userId, query) => {
  const filter = buildUserFilter(userId, query);
  const { page, limit, skip } = buildPagination(query);

  const [items, totalCount] = await Promise.all([
    Expense.find(filter).sort({ year: -1, month: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Expense.countDocuments(filter),
  ]);

  return { items: items.map(normalizeExpenseDoc), meta: buildPaginationMeta(totalCount, page, limit) };
};

const getById = async (userId, id) => {
  const expense = await Expense.findOne({ $and: [buildOwnerScope(userId), buildDocumentIdentityFilter(id)] }).lean();
  if (!expense) {
    throw new ApiError(404, 'Expense entry not found');
  }
  return normalizeExpenseDoc(expense);
};

const create = async (userId, payload) => {
  return Expense.create({
    ...normalizeExpensePayload(payload),
    publicId: await buildPublicId('expense', 'EXP'),
    createdBy: userId,
  });
};

const update = async (userId, id, payload) => {
  const safePayload = normalizeExpensePayload(payload);
  safePayload.createdBy = userId;
  delete safePayload.publicId;

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
