import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { dashboardService } from './dashboard.service.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user.id);
  sendResponse(res, 200, 'Dashboard summary fetched successfully', summary);
});
