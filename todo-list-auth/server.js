require('events').EventEmitter.defaultMaxListeners = 20;
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./db'); // Подключение к БД
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');

const app = express();

app.use(cookieParser());
app.use(session({
  secret: 'ваш_секретный_ключ', // Замените на случайную строку
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Для HTTPS: true
    maxAge: 24 * 60 * 60 * 1000 // 1 день
  }
}));

// requireAuth
const requireAuth = (req, res, next) => {
  if (req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Не авторизован' });
};

// Использование:
app.get('/todo.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'todo.html'));
});

// Middleware
app.use(bodyParser.json()); // Чтение JSON из запросов
app.use(express.static(path.join(__dirname, 'public'))); // Раздача статики (HTML/CSS)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
  next();
});
app.use('/api/*', (req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

// Роут для регистрации
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Проверяем существование пользователя
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем пользователя в БД
    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    
    // Создаем сессию для нового пользователя
    req.session.userId = newUser.rows[0].id;
    req.session.authenticated = true;
    
    // Отправляем успешный ответ с редиректом
    res.json({ 
      success: true,
      redirect: '/todo.html'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Роут для входа
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Успешный вход - отправляем redirect
    res.json({ 
      success: true,
      redirect: '/todo.html'
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
const PORT = 3000;
app.get('/', (req, res) => {
  res.redirect('/index.html');
});
app.get('/todo.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'todo.html'));
});
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

// Получение всех задач пользователя
app.get('/api/todos', requireAuth, async (req, res) => {
  try {
    const todos = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1',
      [req.session.userId]
    );
    res.json(todos.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создание новой задачи
app.post('/api/todos', requireAuth, async (req, res) => {
  const { text } = req.body;
  try {
    const newTodo = await pool.query(
      'INSERT INTO todos (text, user_id) VALUES ($1, $2) RETURNING *',
      [text, req.session.userId]
    );
    res.status(201).json(newTodo.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания задачи' });
  }
});

// Обновление задачи
app.put('/api/todos/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  
  try {
    const updated = await pool.query(
      'UPDATE todos SET text = $1, completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [text, completed, id, req.session.userId]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// Удаление задачи
app.delete('/api/todos/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// Теперь API будет доступно по адресу: http://localhost:3000/api-docs
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Todo API',
    version: '1.0.0'
  },
  paths: {
    '/api/todos': {
      get: { /* описание метода */ }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));