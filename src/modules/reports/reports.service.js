import mongoose from 'mongoose';
import { Income } from '../income/income.model.js';
import { Expense } from '../expense/expense.model.js';

const asObjectId = (value) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  return value;
};

const buildOwnerScope = (userId) => ({
  $or: [{ createdBy: asObjectId(userId) }, { createdBy: null }],
});

const getYearMonthIndex = (year, month) => year * 12 + month;

const getDateRangeMonthBounds = (start, end) => ({
  startIndex: getYearMonthIndex(start.getFullYear(), start.getMonth() + 1),
  endIndex: getYearMonthIndex(end.getFullYear(), end.getMonth() + 1),
});

const getBounds = (preset, startDate, endDate) => {
  const now = new Date();

  switch (preset) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 86400000);
      return { start, end };
    }
    case 'week': {
      const day = now.getDay();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      const end = new Date(start.getTime() + 7 * 86400000);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
    case 'custom': {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? (() => { const d = new Date(endDate); d.setHours(23, 59, 59, 999); return d; })() : new Date();
      return { start, end };
    }
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
  }
};

const sumByCategory = async (Model, userId, dateFilter) => {
  return Model.aggregate([
    { $match: { date: dateFilter, ...buildOwnerScope(userId) } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
};

const sumIncomeByPeriod = async (userId, startIndex, endIndex) => {
  return Income.aggregate([
    {
      $match: {
        ...buildOwnerScope(userId),
        $expr: {
          $and: [
            { $gte: [{ $add: [{ $multiply: ['$year', 12] }, '$month'] }, startIndex] },
            { $lte: [{ $add: [{ $multiply: ['$year', 12] }, '$month'] }, endIndex] },
          ],
        },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
};

const sumIncomeByCategory = async (userId, startIndex, endIndex) => {
  return Income.aggregate([
    {
      $match: {
        ...buildOwnerScope(userId),
        $expr: {
          $and: [
            { $gte: [{ $add: [{ $multiply: ['$year', 12] }, '$month'] }, startIndex] },
            { $lte: [{ $add: [{ $multiply: ['$year', 12] }, '$month'] }, endIndex] },
          ],
        },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);
};

const getSummary = async (userId, { preset, startDate, endDate }) => {
  const { start, end } = getBounds(preset, startDate, endDate);
  const dateFilter = { $gte: start, $lt: end };
  const { startIndex, endIndex } = getDateRangeMonthBounds(start, end);

  const [
    incomeAgg,
    expenseAgg,
    incomeByCategory,
    expenseByCategory,
  ] = await Promise.all([
    sumIncomeByPeriod(userId, startIndex, endIndex),
    Expense.aggregate([{ $match: { date: dateFilter, ...buildOwnerScope(userId) } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    sumIncomeByCategory(userId, startIndex, endIndex),
    sumByCategory(Expense, userId, dateFilter),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  const savings = totalIncome - totalExpense;

  const highestExpenseCategory = expenseByCategory[0] ? {
    category: expenseByCategory[0]._id,
    total: expenseByCategory[0].total,
  } : null;

  const highestIncomeSource = incomeByCategory[0] ? {
    category: incomeByCategory[0]._id,
    total: incomeByCategory[0].total,
  } : null;

  return {
    period: { start, end, preset },
    totalIncome,
    totalExpense,
    savings,
    highestExpenseCategory,
    highestIncomeSource,
    expenseByCategory: expenseByCategory.map((c) => ({ category: c._id, total: c.total })),
    incomeByCategory: incomeByCategory.map((c) => ({ category: c._id, total: c.total })),
  };
};

const getMonthlyBreakdown = async (userId, { months = 12 }) => {
  const now = new Date();
  const startIndex = getYearMonthIndex(now.getFullYear(), now.getMonth() + 1) - (months - 1);
  const endIndex = getYearMonthIndex(now.getFullYear(), now.getMonth() + 1);

  const [incomeMonthly, expenseMonthly] = await Promise.all([
    Income.aggregate([
      {
        $match: {
          ...buildOwnerScope(userId),
          $expr: {
            $and: [
              { $gte: [{ $add: [{ $multiply: ['$year', 12] }, '$month'] }, startIndex] },
              { $lte: [{ $add: [{ $multiply: ['$year', 12] }, '$month'] }, endIndex] },
            ],
          },
        },
      },
      { $group: { _id: { year: '$year', month: '$month' }, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1) }, ...buildOwnerScope(userId) } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
    ]),
  ]);

  const incomeMap = Object.fromEntries(incomeMonthly.map((m) => [`${m._id.year}-${m._id.month}`, m.total]));
  const expenseMap = Object.fromEntries(expenseMonthly.map((m) => [`${m._id.year}-${m._id.month}`, m.total]));

  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const income = incomeMap[key] || 0;
    const expense = expenseMap[key] || 0;
    result.push({
      label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      income,
      expense,
      savings: income - expense,
    });
  }

  return result;
};

export const reportsService = { getSummary, getMonthlyBreakdown };
