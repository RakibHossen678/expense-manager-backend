import { PAGINATION } from '../../constants/pagination.js';

/**
 * Builds a Mongoose filter object from common query params shared by
 * Income and Expense list endpoints:
 *   - search: matches title, category, or notes (case-insensitive)
 *   - category: exact match
 *   - startDate / endDate: inclusive date range on the `date` field
 *   - minAmount / maxAmount: inclusive range on the `amount` field
 *
 * Returns a plain object ready to pass to Model.find().
 */
export const buildListFilter = (query) => {
  const { search, category, startDate, endDate, minAmount, maxAmount } = query;
  const filter = {};

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { category: regex }, { notes: regex }];
  }

  if (category) {
    filter.category = category;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      // Treat endDate as inclusive of the whole day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  return filter;
};

/**
 * Builds pagination params (page, limit, skip) from query, clamped to
 * sane bounds.
 */
export const buildPagination = (query) => {
  const page = Math.max(Number(query.page) || PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(query.limit) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds the `meta` object returned alongside paginated list responses.
 */
export const buildPaginationMeta = (totalCount, page, limit) => ({
  totalCount,
  page,
  limit,
  totalPages: Math.ceil(totalCount / limit) || 1,
  hasNextPage: page * limit < totalCount,
  hasPrevPage: page > 1,
});
