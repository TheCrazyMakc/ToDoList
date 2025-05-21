const { Pool } = require('pg');

// Настройки подключения к БД
const pool = new Pool({
  user: 'postgres',          // Ваш пользователь PostgreSQL
  password: '123456',        // Пароль (замените на реальный)
  host: 'localhost',         // Адрес сервера БД
  database: 'todo_list',     // Имя базы данных
  port: 5432,               // Порт PostgreSQL
  idleTimeoutMillis: 30000,  // Закрыть неиспользуемые соединения через 30 сек
  connectionTimeoutMillis: 2000 // Таймаут подключения 2 секунды
});

// Проверка подключения
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    console.error('Проверьте:');
    console.error('1. Запущен ли сервер PostgreSQL');
    console.error('2. Правильность логина/пароля');
    console.error('3. Существует ли БД todo_list');
    console.error('4. Доступ с localhost разрешен в pg_hba.conf');
  } else {
    console.log('✅ Подключено к PostgreSQL. Серверное время:', res.rows[0].now);
  }
});

// Логирование ошибок в пуле соединений
pool.on('error', (err) => {
  console.error('⚠️ Неожиданная ошибка в пуле соединений PostgreSQL:', err);
});

module.exports = pool;