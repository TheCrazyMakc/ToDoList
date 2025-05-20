const { Pool } = require('pg');

// Настройки подключения к БД
const pool = new Pool({
  user: 'postgres',     // Ваш пользователь (обычно 'postgres')
  password: '123456', // Пароль, который вы задали при установке PostgreSQL
  host: 'localhost',    // Сервер БД (если локально)
  database: 'todo_list', // Имя базы (создайте её в PGAdmin)
  port: 5432,           // Порт PostgreSQL
});

module.exports = pool;