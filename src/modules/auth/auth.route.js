import { Router } from 'express';
import { validateRequest } from '../../helper/utils/validateRequest.js';
import { writeRateLimiter } from '../../middlewares/rateLimiter.js';
import { requireAuth } from '../../middlewares/auth.js';
import { authValidation } from './auth.validation.js';
import { forgotPassword, login, logout, me, register, resetPassword } from './auth.controller.js';

const router = Router();

router.post('/register', writeRateLimiter, authValidation.register, validateRequest, register);
router.post('/login', writeRateLimiter, authValidation.login, validateRequest, login);
router.post('/forgot-password', writeRateLimiter, authValidation.forgotPassword, validateRequest, forgotPassword);
router.post('/reset-password', writeRateLimiter, authValidation.resetPassword, validateRequest, resetPassword);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
