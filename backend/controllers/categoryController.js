const { pool } = require('../config/db');

const getCategories = async (req, res) => {
  const { type } = req.query;

  try {
    let where = 'WHERE (is_default = TRUE OR user_id = ?)';
    const params = [req.user.id];

    if (type) { where += ' AND type = ?'; params.push(type); }

    const [rows] = await pool.query(
      `SELECT * FROM categories ${where} ORDER BY is_default DESC, name ASC`,
      params
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('Get categories error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createCategory = async (req, res) => {
  const { name, type, icon, color } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, type, icon || 'ti-tag', color || '#1D9E75']
    );

    return res.status(201).json({ success: true, message: 'Category created.', data: { id: result.insertId, name, type, icon, color } });
  } catch (err) {
    console.error('Create category error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [cat] = await pool.query('SELECT id FROM categories WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (cat.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found or is a default.' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };
