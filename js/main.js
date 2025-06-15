document.addEventListener('DOMContentLoaded', function() {
  const todoInput = document.getElementById('todoInput');
  const addBtn = document.getElementById('addBtn');
  const todoList = document.getElementById('todoList');

  // Загрузка задач из localStorage при старте
  loadTodos();

  // Обработчик добавления новой задачи
  addBtn.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          addTodo();
      }
  });

  function addTodo() {
      const text = todoInput.value.trim();
      if (text === '') return;

      const todoItem = createTodoElement(text);
      todoList.appendChild(todoItem);
      saveTodos();
      
      todoInput.value = '';
      todoInput.focus();
  }

  function createTodoElement(text, isCompleted = false) {
      const todoItem = document.createElement('div');
      todoItem.className = 'todo-item' + (isCompleted ? ' completed' : '');

      const todoText = document.createElement('span');
      todoText.className = 'todo-text';
      todoText.textContent = text;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'todo-actions';

      const completeBtn = document.createElement('button');
      completeBtn.className = 'complete-btn';
      completeBtn.textContent = isCompleted ? 'Активно' : 'Выполнено';
      completeBtn.addEventListener('click', function() {
          todoItem.classList.toggle('completed');
          completeBtn.textContent = todoItem.classList.contains('completed') ? 'Активно' : 'Выполнено';
          saveTodos();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Удалить';
      deleteBtn.addEventListener('click', function() {
          todoItem.remove();
          saveTodos();
      });

      actionsDiv.appendChild(completeBtn);
      actionsDiv.appendChild(deleteBtn);

      todoItem.appendChild(todoText);
      todoItem.appendChild(actionsDiv);

      return todoItem;
  }

  function saveTodos() {
      const todos = [];
      document.querySelectorAll('.todo-item').forEach(item => {
          todos.push({
              text: item.querySelector('.todo-text').textContent,
              completed: item.classList.contains('completed')
          });
      });
      localStorage.setItem('todos', JSON.stringify(todos));
  }

  function loadTodos() {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
          JSON.parse(savedTodos).forEach(todo => {
              const todoItem = createTodoElement(todo.text, todo.completed);
              todoList.appendChild(todoItem);
          });
      }
  }
});

// Получение задач
async function loadTodos() {
  const response = await fetch('/api/todos', {
    credentials: 'include'
  });
  return await response.json();
}

// Создание задачи
async function createTodo(text) {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text })
  });
  return await response.json();
}

// Пример использования
createTodo('Новая задача').then(console.log);