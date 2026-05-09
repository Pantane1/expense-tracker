const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDB = async () => {
  try {
    const conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        currency VARCHAR(10) DEFAULT 'KSh',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        icon VARCHAR(50) DEFAULT 'ti-tag',
        color VARCHAR(20) DEFAULT '#1D9E75',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        category_id INT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        date DATE NOT NULL,
        receipt_url VARCHAR(255) DEFAULT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_interval ENUM('daily','weekly','monthly','yearly') DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_budget (user_id, category_id, month),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      INSERT IGNORE INTO categories (name, type, icon, color, is_default) VALUES
        ('Salary', 'income', 'ti-building', '#1D9E75', TRUE),
        ('Freelance', 'income', 'ti-device-laptop', '#0F6E56', TRUE),
        ('Business', 'income', 'ti-briefcase', '#5DCAA5', TRUE),
        ('Investment', 'income', 'ti-trending-up', '#3B6D11', TRUE),
        ('Food & Groceries', 'expense', 'ti-shopping-cart', '#D85A30', TRUE),
        ('Transport', 'expense', 'ti-car', '#993C1D', TRUE),
        ('Rent', 'expense', 'ti-home', '#534AB7', TRUE),
        ('Utilities', 'expense', 'ti-bolt', '#185FA5', TRUE),
        ('Entertainment', 'expense', 'ti-device-tv', '#BA7517', TRUE),
        ('School Fees', 'expense', 'ti-school', '#A32D2D', TRUE),
        ('Shopping', 'expense', 'ti-shopping-bag', '#993556', TRUE),
        ('Health', 'expense', 'ti-heart', '#E24B4A', TRUE)
    `);

    conn.release();
    console.log('Database connected and tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };
