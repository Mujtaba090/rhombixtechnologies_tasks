const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = 3000;
const SECRET = 'mysecretkey';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const tasksFile = path.join(__dirname, 'tasks.json');
const usersFile = path.join(__dirname, 'users.json');

function loadJSON(file) {
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file, 'utf8');
  return data ? JSON.parse(data) : [];
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded.email;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Register
app.post('/api/v1/register', (req, res) => {
  const { email, password } = req.body;
  let users = loadJSON(usersFile);
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashed = bcrypt.hashSync(password, 8);
  users.push({ email, password: hashed });
  saveJSON(usersFile, users);
  res.json({ success: true });
});

// Login
app.post('/api/v1/login', (req, res) => {
  const { email, password } = req.body;
  let users = loadJSON(usersFile);
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Get tasks
app.get('/api/v1/tasks', authenticate, (req, res) => {
  const tasks = loadJSON(tasksFile).filter(t => t.user === req.user);
  res.json(tasks);
});

// Add task
app.post('/api/v1/tasks', authenticate, (req, res) => {
  const { text, dueDate } = req.body;
  const tasks = loadJSON(tasksFile);
  const newTask = { id: uuid(), user: req.user, text, dueDate };
  tasks.push(newTask);
  saveJSON(tasksFile, tasks);
  res.json({ success: true });
});

// Delete task
app.delete('/api/v1/tasks/:id', authenticate, (req, res) => {
  let tasks = loadJSON(tasksFile);
  tasks = tasks.filter(t => t.id !== req.params.id || t.user !== req.user);
  saveJSON(tasksFile, tasks);
  res.json({ success: true });
});

// Edit task
app.put('/api/v1/tasks/:id', authenticate, (req, res) => {
  let tasks = loadJSON(tasksFile);
  const task = tasks.find(t => t.id === req.params.id && t.user === req.user);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.text = req.body.text || task.text;
  task.dueDate = req.body.dueDate || task.dueDate;

  saveJSON(tasksFile, tasks);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
