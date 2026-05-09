const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    const token = generateToken(result.insertId);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: result.insertId, name, email, currency: 'KSh' },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, currency: user.currency, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, avatar, currency, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Profile error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  const { name, currency } = req.body;

  try {
    await pool.query(
      'UPDATE users SET name = ?, currency = ? WHERE id = ?',
      [name, currency, req.user.id]
    );
    return res.status(200).json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    console.error('Update profile error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getProfile, updateProfile };
