const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all todos for a user
exports.getAllTodos = async (req, res) => {
  try {
    const userId = req.user.user.id;

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Server error while fetching todos' });
  }
};

// Get a single todo
exports.getTodoById = async (req, res) => {
  try {
    const userId = req.user.user.id;
    const todoId = req.params.id;

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Server error while fetching todo' });
  }
};

// Create a new todo
exports.createTodo = async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { title, description, deadline, priority } = req.body;

    // Validate input
    if (!title || !deadline) {
      return res.status(400).json({ error: 'Please provide title and deadline' });
    }

    const todoId = uuidv4();
    const newTodo = {
      id: todoId,
      title,
      description: description || '',
      is_completed: false,
      priority: priority || 5,
      deadline,
      user_id: userId,
      created_at: new Date()
    };

    const { data, error } = await supabase
      .from('todos')
      .insert([newTodo]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Todo created successfully',
      todo: newTodo
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Server error while creating todo' });
  }
};

// Update a todo
exports.updateTodo = async (req, res) => {
  try {
    const userId = req.user.user.id;
    const todoId = req.params.id;
    const { title, description, is_completed, priority, deadline } = req.body;

    // Check if the todo exists and belongs to the user
    const { data: existingTodo, error: checkError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      return res.status(404).json({ error: 'Todo not found or you do not have permission' });
    }

    // Update the todo
    const { data, error } = await supabase
      .from('todos')
      .update({
        title: title || existingTodo.title,
        description: description !== undefined ? description : existingTodo.description,
        is_completed: is_completed !== undefined ? is_completed : existingTodo.is_completed,
        priority: priority !== undefined ? priority : existingTodo.priority,
        deadline: deadline || existingTodo.deadline,
        updated_at: new Date()
      })
      .eq('id', todoId)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Todo updated successfully' });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Server error while updating todo' });
  }
};

// Delete a todo
exports.deleteTodo = async (req, res) => {
  try {
    const userId = req.user.user.id;
    const todoId = req.params.id;

    // Check if the todo exists and belongs to the user
    const { data: existingTodo, error: checkError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      return res.status(404).json({ error: 'Todo not found or you do not have permission' });
    }

    // Delete the todo
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Server error while deleting todo' });
  }
}; 