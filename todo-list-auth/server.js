const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./db'); // Подключение к БД

const app = express();

// Middleware
app.use(bodyParser.json()); // Чтение JSON из запросов
app.use(express.static('public')); // Раздача статики (HTML/CSS)

// Роут для регистрации
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Проверяем, есть ли пользователь
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Хешируем пароль
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем в БД
    await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2)',
      [username, hashedPassword]
    );
    
    res.status(201).json({ message: 'Пользователь создан!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут для входа
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Ищем пользователя
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверяем пароль
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    res.json({ message: 'Вход выполнен!', user: user.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});