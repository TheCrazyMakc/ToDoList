const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Укажите ваш фронтенд-адрес
  credentials: true
}));

// Подключение к PostgreSQL
const pool = new Pool({
  user: 'todo_user',
  password: 'admin',
  host: 'localhost',
  database: 'todo_app',
  port: 5432
});

// Middleware для проверки JWT
const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });

  try {
    const decoded = jwt.verify(token, 'ваш_секретный_ключ');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

// Регистрация
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    
    const token = jwt.sign({ userId: result.rows[0].id }, 'ваш_секретный_ключ');
    res.cookie('token', token, { httpOnly: true });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Пользователь уже существует' });
  }
});

// Вход
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (!user.rows.length) return res.status(401).json({ error: 'Неверные данные' });

  const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!isValid) return res.status(401).json({ error: 'Неверные данные' });

  const token = jwt.sign({ userId: user.rows[0].id }, 'ваш_секретный_ключ');
  res.cookie('token', token, { httpOnly: true });
  res.json({ success: true });
});

// Работа с задачами
app.get('/api/todos', authenticate, async (req, res) => {
  const todos = await pool.query(
    'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
    [req.userId]
  );
  res.json(todos.rows);
});

app.post('/api/todos', authenticate, async (req, res) => {
  const { text } = req.body;
  const result = await pool.query(
    'INSERT INTO todos (user_id, text) VALUES ($1, $2) RETURNING *',
    [req.userId, text]
  );
  res.json(result.rows[0]);
});

// Запуск сервера
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

