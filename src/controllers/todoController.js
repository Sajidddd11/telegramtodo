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

    // Process the deadline to ensure proper ISO format
    let formattedDeadline;
    try {
      // Create a new Date object and use toISOString for standardization
      formattedDeadline = new Date(deadline).toISOString();
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return res.status(400).json({ error: 'Invalid deadline format. Please use a valid date.' });
    }

    const todoId = uuidv4();
    const newTodo = {
      id: todoId,
      title,
      description: description || '',
      is_completed: false,
      priority: priority || 5,
      deadline: formattedDeadline,
      user_id: userId,
      created_at: new Date().toISOString()
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

    // Process the deadline to ensure proper ISO format if provided
    let formattedDeadline = existingTodo.deadline;
    if (deadline) {
      try {
        formattedDeadline = new Date(deadline).toISOString();
      } catch (error) {
        console.error('Error formatting deadline:', error);
        return res.status(400).json({ error: 'Invalid deadline format. Please use a valid date.' });
      }
    }

    // Update the todo
    const { data, error } = await supabase
      .from('todos')
      .update({
        title: title || existingTodo.title,
        description: description !== undefined ? description : existingTodo.description,
        is_completed: is_completed !== undefined ? is_completed : existingTodo.is_completed,
        priority: priority !== undefined ? priority : existingTodo.priority,
        deadline: formattedDeadline,
        updated_at: new Date().toISOString()
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

// Helper function to get all todos for a user (for Telegram and AI)
exports.getUserTodos = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });
    
    if (error) {
      console.error('Error fetching todos:', error);
      return { todos: [], error };
    }
    
    // Format the todos for display
    const formattedTodos = data.map(todo => ({
      ...todo,
      is_completed: todo.is_completed ? 'Yes' : 'No',
      deadline: todo.deadline ? new Date(todo.deadline).toISOString() : null,
      created_at: todo.created_at ? new Date(todo.created_at).toISOString() : null
    }));

    return { todos: formattedTodos };
  } catch (error) {
    console.error('Error fetching todos:', error);
    return { todos: [], error: 'Server error' };
  }
};

// Helper function to create a todo for a user (for Telegram and AI)
exports.createUserTodo = async (userId, todoData) => {
  try {
    // Validate required fields
    if (!todoData.title) {
      return { error: 'Title is required' };
    }

    // Ensure deadline is valid
    let formattedDeadline;
    if (!todoData.deadline) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      formattedDeadline = tomorrow.toISOString();
    } else {
      try {
        // Process the provided deadline to ensure proper ISO format
        formattedDeadline = new Date(todoData.deadline).toISOString();
      } catch (error) {
        console.error('Error formatting deadline:', error);
        // Set default deadline if parsing fails
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        formattedDeadline = tomorrow.toISOString();
      }
    }

    // Validate priority
    if (todoData.priority) {
      const priority = parseInt(todoData.priority);
      if (isNaN(priority) || priority < 1 || priority > 5) {
        todoData.priority = 3; // Default to 3 if invalid
      } else {
        todoData.priority = priority;
      }
    } else {
      todoData.priority = 3; // Default
    }

    const todoId = uuidv4();
    const newTodo = {
      id: todoId,
      title: todoData.title,
      description: todoData.description || '',
      is_completed: false,
      priority: todoData.priority,
      deadline: formattedDeadline,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('todos')
      .insert([newTodo]);

    return { todo: newTodo, error };
  } catch (error) {
    console.error('Error creating todo:', error);
    return { error: 'Server error' };
  }
};

// Helper function to update a todo for a user (for Telegram and AI)
exports.updateUserTodo = async (userId, todoId, updateData) => {
  try {
    // Check if the todo exists and belongs to the user
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTodo) {
      return { error: 'Todo not found or does not belong to the user' };
    }

    // Validate priority if provided
    if (updateData.priority !== undefined) {
      const priority = parseInt(updateData.priority);
      if (isNaN(priority) || priority < 1 || priority > 5) {
        updateData.priority = existingTodo.priority; // Keep existing priority if invalid
      } else {
        updateData.priority = priority;
      }
    }

    // Update the todo
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', todoId)
      .eq('user_id', userId)
      .select('*');

    if (error) {
      return { error: 'Failed to update todo' };
    }

    const updatedTodo = data[0];
    return { 
      todo: {
        ...updatedTodo,
        is_completed: updatedTodo.is_completed ? 'Yes' : 'No',
        deadline: updatedTodo.deadline ? new Date(updatedTodo.deadline).toISOString() : null,
        created_at: updatedTodo.created_at ? new Date(updatedTodo.created_at).toISOString() : null
      } 
    };
  } catch (error) {
    console.error('Error updating todo:', error);
    return { error: 'Server error' };
  }
};

// Helper function to delete a todo for a user (for Telegram and AI)
exports.deleteUserTodo = async (userId, todoId) => {
  try {
    // Check if the todo exists and belongs to the user
    const { data: existingTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTodo) {
      return { error: 'Todo not found or does not belong to the user' };
    }

    // Delete the todo
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('user_id', userId);

    if (error) {
      return { error: 'Failed to delete todo' };
    }

    return { success: true, deletedTodo: existingTodo };
  } catch (error) {
    console.error('Error deleting todo:', error);
    return { error: 'Server error' };
  }
}; 