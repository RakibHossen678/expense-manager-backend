import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { reportsService } from './reports.service.js';

export const getSummary = asyncHandler(async (req, res) => {
  const { preset = 'month', startDate, endDate } = req.query;
  const summary = await reportsService.getSummary({ preset, startDate, endDate });
  sendResponse(res, 200, 'Report summary fetched successfully', summary);
});

export const getMonthlyBreakdown = asyncHandler(async (req, res) => {
  const months = Math.min(Number(req.query.months) || 12, 24);
  const breakdown = await reportsService.getMonthlyBreakdown({ months });
  sendResponse(res, 200, 'Monthly breakdown fetched successfully', breakdown);
});
