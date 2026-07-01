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

/**
 * True if `value` is one of the fixed categories for `type`, OR a custom
 * category the user has created (stored in the Category collection).
 * Used by both the Mongoose schema validator (income.model.js /
 * expense.model.js / budget.model.js) and indirectly relied upon by the
 * controller layer, so a category created via the Category module is
 * actually usable on entries — a plain static enum would silently reject
 * it.
 *
 * Important: if the Category.exists() lookup itself fails (e.g. DB
 * temporarily unreachable), that's an infrastructure error, not "this
 * category is invalid". We let it propagate so errorHandler.js's
 * normalizeError treats it as an unexpected 500, not a 400 validation
 * failure — Mongoose's validate() would otherwise wrap any thrown error
 * from a custom validator into a ValidationError, masking the distinction.
 */
export const isValidCategory = async (value, type) => {
  if (FIXED_CATEGORIES[type].includes(value)) return true;

  const Category = await getCategoryModel();
  const exists = await Category.exists({ name: value, type });
  return Boolean(exists);
};
