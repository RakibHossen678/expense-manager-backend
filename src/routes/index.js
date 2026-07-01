import { Router } from 'express';
import categoryRoutes from '../modules/category/category.route.js';
import dashboardRoutes from '../modules/dashboard/dashboard.route.js';
import incomeRoutes from '../modules/income/income.route.js';
import expenseRoutes from '../modules/expense/expense.route.js';
import budgetRoutes from '../modules/budget/budget.route.js';
import reportsRoutes from '../modules/reports/reports.route.js';
import authRoutes from '../modules/auth/auth.route.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use('/auth', authRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

router.use(requireAuth);
router.use('/dashboard', dashboardRoutes);
router.use('/income', incomeRoutes);
router.use('/expense', expenseRoutes);
router.use('/budget', budgetRoutes);
router.use('/category', categoryRoutes);
router.use('/reports', reportsRoutes);

export default router;
