const { pool } = require('../config/db');

const getBudgets = async (req, res) => {
  const { month } = req.query;
  const target = month || new Date().toISOString().slice(0, 7);

  try {
    const [budgets] = await pool.query(
      `SELECT b.*, c.name AS category_name, c.icon, c.color,
              COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id
         AND t.user_id = b.user_id
         AND t.type = 'expense'
         AND DATE_FORMAT(t.date, '%Y-%m') = b.month
       WHERE b.user_id = ? AND b.month = ?
       GROUP BY b.id`,
      [req.user.id, target]
    );

    return res.status(200).json({ success: true, data: budgets });
  } catch (err) {
    console.error('Get budgets error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createBudget = async (req, res) => {
  const { category_id, amount, month } = req.body;

  try {
    await pool.query(
      `INSERT INTO budgets (user_id, category_id, amount, month)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = ?`,
      [req.user.id, category_id, amount, month, amount]
    );

    return res.status(201).json({ success: true, message: 'Budget saved.' });
  } catch (err) {
    console.error('Create budget error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteBudget = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.status(200).json({ success: true, message: 'Budget deleted.' });
  } catch (err) {
    console.error('Delete budget error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getBudgets, createBudget, deleteBudget };
