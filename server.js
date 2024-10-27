const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

let todos = {}; // To store todos
let categories = {}; // To store categories as keys
const generateId = () => Math.random().toString(36).substr(2, 9);

// Get all todos
app.get('/api/todos', (req, res) => {
  res.json(Object.values(todos));
});

// Get a single todo by ID
app.get('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const todo = todos[id];
  if (!todo) {
    return res.status(404).json({ error: 'TODO not found' });
  }
  res.json(todo);
});

// Clear all completed todos
app.delete('/api/todos/clear-completed', (req, res) => {
  console.log("Received request to clear completed todos"); // Debugging log

  Object.keys(todos).forEach(id => {
    if (todos[id].todoComplete) delete todos[id];
  });

  console.log("Remaining todos after clearing completed:", todos);
  res.json({ message: 'Completed todos cleared' });
});

// Create a new todo
app.post('/api/todos', (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }
  const id = generateId();
  todos[id] = { id, title, description, category, todoComplete: false };
  res.status(201).json(todos[id]);
});

// Update a todo by ID
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category, todoComplete } = req.body;
  if (!todos[id]) return res.status(404).json({ error: 'TODO not found' });
  todos[id] = { ...todos[id], title, description, category, todoComplete };
  res.json(todos[id]);
});

// Delete a todo by ID
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  if (!todos[id]) return res.status(404).json({ error: 'TODO not found' });
  delete todos[id];
  res.json({ message: 'TODO deleted' });
});

// Get all categories
app.get('/api/categories', (req, res) => {
  res.json(Object.keys(categories));
});

// Create a new category
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  if (categories[name]) return res.status(400).json({ error: 'Category already exists' });
  categories[name] = { name };
  res.status(201).json({ message: 'Category created', name });
});

// Update an existing category
app.put('/api/categories/:category', (req, res) => {
  const { category } = req.params;
  const { newName } = req.body;
  if (!categories[category]) return res.status(404).json({ error: 'Category not found' });
  if (!newName) return res.status(400).json({ error: 'New category name is required' });
  categories[newName] = { name: newName };
  delete categories[category];
  
  // Update todos with the new category name
  Object.values(todos).forEach(todo => {
    if (todo.category === category) todo.category = newName;
  });
  res.json({ message: 'Category updated', newName });
});

// Delete a category and associated todos
app.delete('/api/categories/:category', (req, res) => {
  const { category } = req.params;
  if (!categories[category]) return res.status(404).json({ error: 'Category not found' });
  
  // Delete todos in this category
  Object.keys(todos).forEach(id => {
    if (todos[id].category === category) delete todos[id];
  });
  
  delete categories[category];
  res.json({ message: 'Category and associated todos deleted' });
});

// Start server
app.listen(port, () => {
  console.log(`TODO app listening at http://localhost:${port}`);
});
