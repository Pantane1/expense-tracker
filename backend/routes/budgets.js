const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getBudgets);
router.post('/', createBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
