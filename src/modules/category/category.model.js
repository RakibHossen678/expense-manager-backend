import mongoose from 'mongoose';
import { baseModelPlugin } from '../../utils/baseModelPlugin.js';

/**
 * Categories here represent user-defined additions beyond the built-in
 * fixed lists (see src/constants/incomeCategories.js and
 * expenseCategories.js). The fixed lists are NOT stored in the DB — they're
 * always available. This collection only holds custom categories the user
 * creates, scoped by type so income and expense category pools stay separate.
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [40, 'Category name must be 40 characters or fewer'],
  },
  type: {
    type: String,
    enum: {
      values: ['income', 'expense'],
      message: 'Category type must be either "income" or "expense"',
    },
    required: [true, 'Category type is required'],
  },
  icon: {
    type: String,
    default: 'MoreHorizontal',
    trim: true,
  },
  color: {
    type: String,
    default: '#8a8d99',
    trim: true,
  },
  publicId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true,
  },
});

// Prevent duplicate category names within the same type
categorySchema.index({ name: 1, type: 1 }, { unique: true });

categorySchema.plugin(baseModelPlugin);

export const Category = mongoose.model('Category', categorySchema);
