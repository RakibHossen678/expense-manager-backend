import mongoose from 'mongoose';
import { baseModelPlugin } from '../../utils/baseModelPlugin.js';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories.js';
import { isValidCategory } from '../../helper/utils/categoryValidator.js';

/**
 * Expense entry. Matches the spec's data model: Title, Amount, Category,
 * Date, Description (optional), Notes (optional). Kept as a fully separate
 * collection/API from Income per the spec (no unified Transaction model).
 */
const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title must be 100 characters or fewer'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    // Validated against the fixed list PLUS any custom categories the user
    // has created — see helper/utils/categoryValidator.js.
    validate: {
      validator: (value) => isValidCategory(value, 'expense'),
      message: (props) => `"${props.value}" is not a valid expense category`,
    },
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be 500 characters or fewer'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes must be 500 characters or fewer'],
  },
});

// Supports date-range queries (reports, dashboard) and category filtering
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

expenseSchema.plugin(baseModelPlugin);

export const Expense = mongoose.model('Expense', expenseSchema);
