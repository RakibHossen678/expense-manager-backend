import { asyncHandler } from '../../helper/utils/asyncHandler.js';
import { sendResponse } from '../../helper/utils/sendResponse.js';
import { authService } from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  sendResponse(res, 201, 'Account created successfully', result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendResponse(res, 200, 'Signed in successfully', result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  sendResponse(res, 200, 'Session loaded successfully', { user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  sendResponse(res, 200, 'Signed out successfully');
});
