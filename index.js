const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
let tasks = [
  { id: 1, title: "Learn Express", completed: false, priority: "high" },
  { id: 2, title: "Finish Lab 2", completed: true, priority: "medium" },
  { id: 3, title: "Revise REST API", completed: false, priority: "low" }
];
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};
app.use(logger);
const requireAuth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (token !== "Bearer secret123") {
    return res.status(403).json({ message: "Invalid token" });
  }

  next();
};
const validateTask = (req, res, next) => {
  const { title, completed, priority } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ message: "Title is required" });
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ message: "Completed must be boolean" });
  }

  const allowedPriorities = ["low", "medium", "high"];
  if (!allowedPriorities.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }

  next();
};

app.get('/', (req, res) => {
  res.json({ message: "Tasks API v1.0" });
});

app.get('/tasks', (req, res) => {
  let result = [...tasks];

  if (req.query.completed) {
    result = result.filter(
      t => t.completed === (req.query.completed === "true")
    );
  }

  if (req.query.priority) {
    result = result.filter(
      t => t.priority === req.query.priority
    );
  }

  if (req.query.sort) {
    const order = req.query.order === "desc" ? -1 : 1;
    result.sort((a, b) =>
      a[req.query.sort] > b[req.query.sort] ? order : -order
    );
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || result.length;
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  res.json({
    success: true,
    count: paginated.length,
    data: paginated
  });
});

app.get('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.json({ success: true, data: task });
});

app.post('/tasks', requireAuth, validateTask, (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: req.body.title,
    completed: req.body.completed || false,
    priority: req.body.priority
  };

  tasks.push(newTask);

  res.status(201).json({
    success: true,
    data: newTask
  });
});

app.put('/tasks/:id', requireAuth, validateTask, (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks[index] = {
    id: tasks[index].id,
    title: req.body.title,
    completed: req.body.completed,
    priority: req.body.priority
  };

  res.json({ success: true, data: tasks[index] });
});

app.delete('/tasks/:id', requireAuth, (req, res) => {
  const index = tasks.findIndex(t => t.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks.splice(index, 1);

  res.status(204).send();
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});