const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all todo routes
router.use(authMiddleware);

// GET /api/todos
router.get('/', todoController.getAllTodos);

// GET /api/todos/:id
router.get('/:id', todoController.getTodoById);

// POST /api/todos
router.post('/', todoController.createTodo);

// PUT /api/todos/:id
router.put('/:id', todoController.updateTodo);

// DELETE /api/todos/:id
router.delete('/:id', todoController.deleteTodo);

module.exports = router; 