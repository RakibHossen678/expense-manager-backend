import { Router } from 'express';
import categoryRoutes from '../modules/category/category.route.js';
import dashboardRoutes from '../modules/dashboard/dashboard.route.js';
import incomeRoutes from '../modules/income/income.route.js';
import expenseRoutes from '../modules/expense/expense.route.js';
import budgetRoutes from '../modules/budget/budget.route.js';
import reportsRoutes from '../modules/reports/reports.route.js';

const router = Router();

router.use('/category', categoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/income', incomeRoutes);
router.use('/expense', expenseRoutes);
router.use('/budget', budgetRoutes);
router.use('/reports', reportsRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
