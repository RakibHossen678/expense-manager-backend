import mongoose from 'mongoose';
import { baseModelPlugin } from '../../utils/baseModelPlugin.js';
import { isValidCategory, resolveCreatedByFromContext } from '../../helper/utils/categoryValidator.js';

/**
 * Expense entry. Kept as a fully separate collection/API from Income.
 * Expenses are stored with month/year so the UI can browse them monthwise,
 * while still allowing legacy date-based entries to be read.
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
    // has created â€” see helper/utils/categoryValidator.js.
    validate: {
      validator: function validateExpenseCategory(value) {
        return isValidCategory(value, 'expense', resolveCreatedByFromContext(this));
      },
      message: (props) => `"${props.value}" is not a valid expense category`,
    },
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
    index: true,
  },
  year: {
    type: Number,
    index: true,
  },
  date: {
    type: Date,
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
  publicId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    index: true,
  },
});

// Supports monthwise browsing plus category filtering.
expenseSchema.index({ year: 1, month: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ createdBy: 1, year: -1, month: -1, createdAt: -1 });

expenseSchema.plugin(baseModelPlugin);

expenseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.publicId || ret._id.toString();

    if ((!ret.month || !ret.year) && ret.date) {
      const date = new Date(ret.date);
      if (!Number.isNaN(date.getTime())) {
        ret.month = ret.month || date.getMonth() + 1;
        ret.year = ret.year || date.getFullYear();
      }
    }

    delete ret._id;
    return ret;
  },
});

export const Expense = mongoose.model('Expense', expenseSchema);
