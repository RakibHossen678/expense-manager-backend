import mongoose from 'mongoose';
import { baseModelPlugin } from '../../utils/baseModelPlugin.js';
import { isValidCategory } from '../../helper/utils/categoryValidator.js';

/**
 * A budget is monthly and scoped to a specific expense category, OR can be
 * an "overall" budget (category: null) covering total spending for the
 * month. The dashboard surfaces the overall budget; the Budget page
 * surfaces both, with progress bars and exceeded warnings per category.
 */
const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    default: null, // null = overall monthly budget, not category-specific
    // null is valid (overall budget); any non-null value must be a real
    // expense category — fixed list or custom (see categoryValidator.js).
    validate: {
      validator: (value) => value === null || isValidCategory(value, 'expense'),
      message: (props) => `"${props.value}" is not a valid expense category`,
    },
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0.01, 'Budget amount must be greater than 0'],
  },
  month: {
    // 1-12
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
  },
});

// One budget per category (or overall, where category is null) per month
budgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });

budgetSchema.plugin(baseModelPlugin);

export const Budget = mongoose.model('Budget', budgetSchema);
