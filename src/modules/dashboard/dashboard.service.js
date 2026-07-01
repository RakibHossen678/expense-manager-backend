import { Income } from '../income/income.model.js';
import { Expense } from '../expense/expense.model.js';
import { Budget } from '../budget/budget.model.js';

const RECENT_LIMIT = 3;

const getMonthBounds = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

/**
 * Sums the `amount` field across all documents in a collection, optionally
 * scoped to a date range. Returns 0 if there are no matching documents
 * (rather than null/undefined, which would propagate awkwardly into math
 * elsewhere).
 */
const sumAmount = async (Model, dateRange = null) => {
  const match = dateRange ? { date: { $gte: dateRange.start, $lt: dateRange.end } } : {};
  const result = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Returns the category with the highest total amount, or null if there are
 * no expense entries at all.
 */
const getHighestExpenseCategory = async () => {
  const result = await Expense.aggregate([
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 1 },
  ]);
  if (result.length === 0) return null;
  return { category: result[0]._id, total: result[0].total };
};

/**
 * Returns income/expense totals grouped by month for the last `months`
 * months (including the current month), oldest first — shaped for a
 * Recharts-friendly array. Months with no entries still appear, with 0.
 */
const getMonthlySummary = async (months = 6) => {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [incomeByMonth, expenseByMonth] = await Promise.all([
    Income.aggregate([
      { $match: { date: { $gte: rangeStart } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: rangeStart } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const incomeMap = new Map(incomeByMonth.map((m) => [`${m._id.year}-${m._id.month}`, m.total]));
  const expenseMap = new Map(expenseByMonth.map((m) => [`${m._id.year}-${m._id.month}`, m.total]));

  const summary = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const income = incomeMap.get(key) || 0;
    const expense = expenseMap.get(key) || 0;
    summary.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleString('en-US', { month: 'short' }),
      income,
      expense,
      savings: income - expense,
    });
  }

  return summary;
};

/**
 * Finds the current month's "overall" budget (category: null) and computes
 * how much remains against actual spending this month. Returns null if no
 * overall budget has been set — the frontend renders this distinctly from
 * a real $0 remaining (e.g. "No budget set" vs "$0.00 left").
 */
const getBudgetRemaining = async (currentMonthExpense) => {
  const now = new Date();
  const overallBudget = await Budget.findOne({
    category: null,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  if (!overallBudget) return null;

  return {
    budgetAmount: overallBudget.amount,
    spent: currentMonthExpense,
    remaining: overallBudget.amount - currentMonthExpense,
    isExceeded: currentMonthExpense > overallBudget.amount,
  };
};

const getDashboardSummary = async () => {
  const { start: monthStart, end: monthEnd } = getMonthBounds();

  const [
    totalIncome,
    totalExpense,
    currentMonthIncome,
    currentMonthExpense,
    highestExpenseCategory,
    recentExpenses,
    recentIncome,
    monthlySummary,
  ] = await Promise.all([
    sumAmount(Income),
    sumAmount(Expense),
    sumAmount(Income, { start: monthStart, end: monthEnd }),
    sumAmount(Expense, { start: monthStart, end: monthEnd }),
    getHighestExpenseCategory(),
    Expense.find().sort({ date: -1 }).limit(RECENT_LIMIT),
    Income.find().sort({ date: -1 }).limit(RECENT_LIMIT),
    getMonthlySummary(6),
  ]);

  // Depends on currentMonthExpense above, so it can't join the batch.
  const budgetRemaining = await getBudgetRemaining(currentMonthExpense);

  const totalBalance = totalIncome - totalExpense;
  // "Savings" here means net position (income minus expense) — same value
  // as balance for a single-account personal tracker, exposed separately
  // per the spec's explicit "Total Savings" stat.
  const totalSavings = totalBalance;

  return {
    totalBalance,
    totalIncome,
    totalExpense,
    totalSavings,
    currentMonthIncome,
    currentMonthExpense,
    budgetRemaining,
    highestExpenseCategory,
    recentExpenses,
    recentIncome,
    monthlySummary,
  };
};

export const dashboardService = { getDashboardSummary };
