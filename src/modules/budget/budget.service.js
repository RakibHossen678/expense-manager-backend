import { Budget } from './budget.model.js';
import { Expense } from '../expense/expense.model.js';
import { ApiError } from '../../errors/ApiError.js';

const getMonthBounds = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
};

/**
 * Sums expenses for a given month/year, optionally scoped to a category.
 * `category: null` means "all categories" (overall budget).
 */
const getSpentAmount = async (month, year, category) => {
  const { start, end } = getMonthBounds(month, year);
  const match = { date: { $gte: start, $lt: end } };
  if (category) match.category = category;

  const result = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Enriches a raw budget document with actual spend, remaining amount,
 * progress percentage (for progress bars), and an exceeded flag (for the
 * spec's "budget exceeded warning").
 */
const enrichBudget = async (budget) => {
  const spent = await getSpentAmount(budget.month, budget.year, budget.category);
  const remaining = budget.amount - spent;
  const progress = Math.min((spent / budget.amount) * 100, 100);

  return {
    ...budget.toJSON(),
    spent,
    remaining,
    progress,
    isExceeded: spent > budget.amount,
  };
};

const getAll = async (query) => {
  const filter = {};
  if (query.month) filter.month = Number(query.month);
  if (query.year) filter.year = Number(query.year);

  const budgets = await Budget.find(filter).sort({ year: -1, month: -1, category: 1 });
  return Promise.all(budgets.map(enrichBudget));
};

const getById = async (id) => {
  const budget = await Budget.findById(id);
  if (!budget) {
    throw new ApiError(404, 'Budget not found');
  }
  return enrichBudget(budget);
};

const create = async (payload) => {
  // Normalize an absent/empty category to null so the unique index
  // (category, month, year) correctly treats it as the "overall" budget.
  const normalized = { ...payload, category: payload.category || null };

  try {
    return await Budget.create(normalized);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        normalized.category
          ? `A budget for "${normalized.category}" already exists for this month`
          : 'An overall budget already exists for this month'
      );
    }
    throw error;
  }
};

const update = async (id, payload) => {
  const normalized = { ...payload };
  if ('category' in payload) normalized.category = payload.category || null;

  try {
    const budget = await Budget.findByIdAndUpdate(id, normalized, {
      new: true,
      runValidators: true,
    });
    if (!budget) {
      throw new ApiError(404, 'Budget not found');
    }
    return budget;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'A budget already exists for this category and month');
    }
    throw error;
  }
};

const remove = async (id) => {
  const budget = await Budget.findByIdAndDelete(id);
  if (!budget) {
    throw new ApiError(404, 'Budget not found');
  }
  return budget;
};

export const budgetService = { getAll, getById, create, update, remove };
