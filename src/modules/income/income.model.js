import mongoose from 'mongoose';
import { baseModelPlugin } from '../../utils/baseModelPlugin.js';
import { isValidCategory } from '../../helper/utils/categoryValidator.js';

/**
 * Income entry. Stored on a monthly basis so the UI can work with month
 * and year instead of a specific day.
 */
const buildMonthStartDate = (month, year) => new Date(year, month - 1, 1);

const incomeSchema = new mongoose.Schema({
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
    // has created (see helper/utils/categoryValidator.js) — a plain enum
    // here would silently reject custom categories created via the
    // Category module, making that feature non-functional.
    validate: {
      validator: (value) => isValidCategory(value, 'income'),
      message: (props) => `"${props.value}" is not a valid income category`,
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
    default: undefined,
    index: true,
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

incomeSchema.pre('validate', function normalizeIncomePeriod(next) {
  const month = Number(this.month);
  const year = Number(this.year);
  const hasMonth = Number.isInteger(month) && month >= 1 && month <= 12;
  const hasYear = Number.isInteger(year) && year >= 2000;
  const hasDate = this.date instanceof Date && !Number.isNaN(this.date.getTime());

  if (hasMonth) this.month = month;
  if (hasYear) this.year = year;

  if (hasMonth && hasYear) {
    this.date = buildMonthStartDate(month, year);
  } else if (hasDate) {
    this.month = this.date.getMonth() + 1;
    this.year = this.date.getFullYear();
    this.date = buildMonthStartDate(this.month, this.year);
  }

  next();
});

// Supports month-based queries and backward-compatible date lookups.
incomeSchema.index({ year: 1, month: 1 });
incomeSchema.index({ createdBy: 1, year: -1, month: -1 });
incomeSchema.index({ date: -1 });
incomeSchema.index({ category: 1 });

incomeSchema.plugin(baseModelPlugin);

incomeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret.publicId || ret._id.toString();

    if ((!ret.month || !ret.year) && ret.date) {
      const date = new Date(ret.date);
      ret.month = ret.month || date.getMonth() + 1;
      ret.year = ret.year || date.getFullYear();
    }

    delete ret._id;
    return ret;
  },
});

export const Income = mongoose.model('Income', incomeSchema);
