let token = '';

document.getElementById('login').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/v1/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    document.getElementById('auth').style.display = 'none';
    document.getElementById('todo-section').style.display = 'block';
    loadTasks();
  } else {
    alert(data.error || 'Login failed');
  }
};

document.getElementById('register').onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/v1/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  alert(data.success ? 'Registered successfully! Now login.' : data.error);
};

document.getElementById('addTask').onclick = async () => {
  const text = document.getElementById('taskText').value;
  const dueDate = document.getElementById('dueDate').value;
  if (!text) return alert('Enter a task!');
  const res = await fetch('/api/v1/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text, dueDate }),
  });
  const data = await res.json();
  if (data.success) {
    document.getElementById('taskText').value = '';
    document.getElementById('dueDate').value = '';
    loadTasks();
  }
};

async function loadTasks() {
  const res = await fetch('/api/v1/tasks', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tasks = await res.json();
  const list = document.getElementById('taskList');
  list.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');

    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    const dueDate = document.createElement('span');
    dueDate.className = 'task-date';
    dueDate.textContent = task.dueDate || 'No due date';

    taskContent.appendChild(checkbox);
    taskContent.appendChild(taskText);
    taskContent.appendChild(dueDate);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.onclick = () => {
      const newText = prompt('Edit task text:', task.text);
      const newDate = prompt('Edit due date (YYYY-MM-DD):', task.dueDate || '');
      if (newText !== null && newDate !== null) {
        fetch(`/api/v1/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: newText, dueDate: newDate })
        }).then(() => loadTasks());
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = async () => {
      await fetch(`/api/v1/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadTasks();
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(taskContent);
    li.appendChild(actions);
    list.appendChild(li);
  });
}
