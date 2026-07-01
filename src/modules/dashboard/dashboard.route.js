import { Router } from 'express';
import { getDashboardSummary } from './dashboard.controller.js';

const router = Router();

router.get('/summary', getDashboardSummary);

export default router;
