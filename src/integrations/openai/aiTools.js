/**
 * Tools for OpenAI integration to interact with todos
 */
const todoController = require('../../controllers/todoController');

/**
 * Get all todos for a user
 * @param {object} params - Parameters
 * @param {string} params.userId - User ID to get todos for
 * @returns {object} - Array of todos or error
 */
async function getAllTodos(params) {
  try {
    if (!params || !params.userId) {
      console.error('Missing userId in getAllTodos params:', params);
      return { error: 'User ID is required', todos: [] };
    }

    const { userId } = params;
    console.log(`Getting todos for user ${userId}`);
    
    const result = await todoController.getUserTodos(userId);
    console.log(`GetUserTodos result:`, result);
    
    // Format the result properly for consistent access
    if (result.data && Array.isArray(result.data)) {
      return {
        todos: result.data,
        error: result.error
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in getAllTodos:', error);
    return { error: 'Failed to get todos', todos: [] };
  }
}

/**
 * Create a new todo for a user
 * @param {object} params - Todo creation parameters
 * @param {string} params.userId - User ID to create todo for
 * @param {string} params.title - Todo title (required)
 * @param {string} params.description - Todo description (optional)
 * @param {number} params.priority - Todo priority (High: >8, Medium: 5-8, Low: <5, optional)
 * @param {string} params.deadline - Todo deadline in ISO format (optional)
 * @returns {object} - Created todo or error
 */
async function createTodo(params) {
  try {
    const { userId, title, description, priority, deadline } = params;
    
    // Validate required fields
    if (!title) {
      return { error: 'Title is required' };
    }

    // Create todo data object
    const todoData = {
      title,
      description: description || '',
      priority: priority ? parseInt(priority) : 3, // Default to low priority (3)
      deadline: deadline || null
    };

    // Call the controller to create the todo
    const { todo, error } = await todoController.createUserTodo(userId, todoData);
    
    if (error) {
      return { error };
    }
    
    return { todo };
  } catch (error) {
    console.error('Error in createTodo:', error);
    return { error: 'Failed to create todo' };
  }
}

/**
 * Update an existing todo
 * @param {object} params - Todo update parameters
 * @param {string} params.userId - User ID
 * @param {string} params.todoId - Todo ID to update
 * @param {string} params.title - New title (optional)
 * @param {string} params.description - New description (optional)
 * @param {boolean} params.is_completed - New completion status (optional)
 * @param {number} params.priority - New priority (High: >8, Medium: 5-8, Low: <5, optional)
 * @param {string} params.deadline - New deadline in ISO format (optional)
 * @returns {object} - Updated todo or error
 */
async function updateTodo(params) {
  try {
    const { userId, todoId, title, description, is_completed, priority, deadline } = params;
    
    // Validate todoId
    if (!todoId) {
      return { error: 'Todo ID is required' };
    }

    // Create update data object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (is_completed !== undefined) updateData.is_completed = !!is_completed; // Convert to boolean
    if (priority !== undefined) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = deadline;
    
    // Call the controller to update the todo
    const { todo, error } = await todoController.updateUserTodo(userId, todoId, updateData);
    
    if (error) {
      return { error };
    }
    
    return { todo };
  } catch (error) {
    console.error('Error in updateTodo:', error);
    return { error: 'Failed to update todo' };
  }
}

/**
 * Delete a todo
 * @param {object} params - Todo deletion parameters
 * @param {string} params.userId - User ID
 * @param {string} params.todoId - Todo ID to delete
 * @returns {object} - Success status or error
 */
async function deleteTodo(params) {
  try {
    const { userId, todoId } = params;
    
    // Validate todoId
    if (!todoId) {
      return { error: 'Todo ID is required' };
    }
    
    // Call the controller to delete the todo
    const { success, deletedTodo, error } = await todoController.deleteUserTodo(userId, todoId);
    
    if (error) {
      return { error };
    }
    
    return { success, deletedTodo };
  } catch (error) {
    console.error('Error in deleteTodo:', error);
    return { error: 'Failed to delete todo' };
  }
}

/**
 * Search todos based on a keyword/query
 * @param {object} params - Search parameters
 * @param {string} params.userId - User ID to search todos for
 * @param {string} params.query - Search query to match against title or description
 * @returns {Array} - Array of matching todos
 */
async function searchTodos(params) {
  try {
    const { userId, query } = params;
    
    if (!query) {
      return { error: "Search query is required" };
    }

    const result = await todoController.getUserTodos(userId);
    
    if (result.error) {
      console.error('Error searching todos:', result.error);
      return { error: 'Failed to search todos' };
    }

    // Filter todos based on search query (case insensitive)
    const searchQuery = query.toLowerCase();
    
    // Access todos from result.data (the actual format returned by controller)
    const todos = result.data || [];
    
    const matchingTodos = todos.filter(todo => {
      const titleMatch = todo.title && todo.title.toLowerCase().includes(searchQuery);
      const descMatch = todo.description && todo.description.toLowerCase().includes(searchQuery);
      return titleMatch || descMatch;
    });

    return { todos: matchingTodos };
  } catch (error) {
    console.error('Error in searchTodos:', error);
    return { error: 'Failed to search todos', todos: [] };
  }
}

module.exports = {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  searchTodos
}; 