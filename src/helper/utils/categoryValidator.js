import { INCOME_CATEGORIES } from '../../constants/incomeCategories.js';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories.js';

// Lazy import to avoid a circular dependency: Category model doesn't
// depend on Income/Expense, but this file is imported by both, and a
// top-level import here would load category.model.js before mongoose
// has registered it in some import orderings. Dynamic import sidesteps it.
let categoryModelPromise = null;
const getCategoryModel = () => {
  if (!categoryModelPromise) {
    categoryModelPromise = import('../../modules/category/category.model.js').then((m) => m.Category);
  }
  return categoryModelPromise;
};

const FIXED_CATEGORIES = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
};

export const resolveCreatedByFromContext = (context) => {
  if (!context) return null;

  if (context.createdBy) {
    return context.createdBy;
  }

  if (typeof context.getUpdate === 'function') {
    const update = context.getUpdate() || {};
    return update.createdBy || update.$set?.createdBy || null;
  }

  return null;
};

/**
 * True if `value` is one of the fixed categories for `type`, OR a custom
 * category created by `userId`.
 */
export const isValidCategory = async (value, type, userId) => {
  if (FIXED_CATEGORIES[type].includes(value)) return true;

  const Category = await getCategoryModel();
  const exists = await Category.exists({ name: value, type, createdBy: userId });
  return Boolean(exists);
};
