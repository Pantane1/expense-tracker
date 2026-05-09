const { pool } = require('../config/db');

const getTransactions = async (req, res) => {
  const { type, category_id, start_date, end_date, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let where = 'WHERE t.user_id = ?';
    const params = [req.user.id];

    if (type) { where += ' AND t.type = ?'; params.push(type); }
    if (category_id) { where += ' AND t.category_id = ?'; params.push(category_id); }
    if (start_date) { where += ' AND t.date >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND t.date <= ?'; params.push(end_date); }
    if (search) { where += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon, c.color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       ${where}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions t ${where}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get transactions error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createTransaction = async (req, res) => {
  const { title, amount, type, category_id, description, date, is_recurring, recurring_interval } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO transactions (user_id, title, amount, type, category_id, description, date, is_recurring, recurring_interval)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, amount, type, category_id || null, description || null, date, is_recurring || false, recurring_interval || null]
    );

    const [[transaction]] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon, c.color
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, message: 'Transaction created.', data: transaction });
  } catch (err) {
    console.error('Create transaction error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { title, amount, type, category_id, description, date, is_recurring, recurring_interval } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await pool.query(
      `UPDATE transactions SET title=?, amount=?, type=?, category_id=?, description=?, date=?, is_recurring=?, recurring_interval=?
       WHERE id = ? AND user_id = ?`,
      [title, amount, type, category_id || null, description || null, date, is_recurring || false, recurring_interval || null, id, req.user.id]
    );

    const [[updated]] = await pool.query(
      `SELECT t.*, c.name AS category_name, c.icon, c.color
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    return res.status(200).json({ success: true, message: 'Transaction updated.', data: updated });
  } catch (err) {
    console.error('Update transaction error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.status(200).json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    console.error('Delete transaction error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSummary = async (req, res) => {
  const { month } = req.query;
  const target = month || new Date().toISOString().slice(0, 7);

  try {
    const [[income]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'income' AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [req.user.id, target]
    );

    const [[expense]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
       WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [req.user.id, target]
    );

    const [byCategory] = await pool.query(
      `SELECT c.name, c.color, c.icon, t.type, SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND DATE_FORMAT(t.date, '%Y-%m') = ?
       GROUP BY c.id, t.type
       ORDER BY total DESC`,
      [req.user.id, target]
    );

    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month, type, SUM(amount) AS total
       FROM transactions
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month, type
       ORDER BY month ASC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        month: target,
        totalIncome: parseFloat(income.total),
        totalExpenses: parseFloat(expense.total),
        balance: parseFloat(income.total) - parseFloat(expense.total),
        byCategory,
        monthly,
      },
    });
  } catch (err) {
    console.error('Summary error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, getSummary };
