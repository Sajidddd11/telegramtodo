/**
 * OpenAI integration for natural language processing of todo items
 */
const { OpenAI } = require('openai');
const aiTools = require('./aiTools');

// Check for API key in environment
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not defined in environment variables');
}

let openaiClient = null;

// Create a conversation history map to track conversations by userId
const conversationHistories = new Map();

// Maximum number of messages to keep in history
const MAX_HISTORY_LENGTH = 10;

/**
 * Initialize the OpenAI client
 */
function initOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI client not initialized - missing API key');
    return null;
  }

  try {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
    return openaiClient;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    return null;
  }
}

/**
 * Get the OpenAI client instance
 * @returns {OpenAI|null} - The OpenAI client or null if not initialized
 */
function getOpenAIClient() {
  return openaiClient;
}

// Helper function to clean and format response text
function cleanAndFormatResponse(text) {
  if (typeof text !== 'string') return text;
  
  // Remove the OUTPUT: prefix if present
  let cleanText = text;
  if (cleanText.startsWith('OUTPUT:')) {
    cleanText = cleanText.replace('OUTPUT:', '').trim();
  }
  
  // Remove all markdown formatting
  cleanText = cleanText
    .replace(/\*\*/g, '')   // Remove bold formatting
    .replace(/\*/g, '')     // Remove italic formatting
    .replace(/\_\_/g, '')   // Remove underline formatting
    .replace(/\_/g, '')     // Remove other underscores
    .replace(/\#\#\#/g, '') // Remove heading formatting
    .replace(/\#\#/g, '')
    .replace(/\#/g, '')
    .replace(/\`\`\`/g, '') // Remove code block formatting
    .replace(/\`/g, '');    // Remove inline code formatting
  
  // Add "boss" if not already present
  if (!cleanText.toLowerCase().includes('boss')) {
    // If it's a question or ends with a sentence
    if (cleanText.match(/[.!?]$/)) {
      cleanText = cleanText.replace(/([.!?])$/, ', boss$1');
    } else {
      cleanText += ', boss';
    }
  }
  
  // Add an emoji if not present
  const emojis = ['😊', '👍', '✅', '📝', '📋', '🗓️', '⏰', '🔍', '👌', '💪'];
  let hasEmoji = false;
  emojis.forEach(emoji => {
    if (cleanText.includes(emoji)) hasEmoji = true;
  });
  
  if (!hasEmoji) {
    cleanText += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
  }
  
  return cleanText;
}

/**
 * Process a natural language request about todos
 * @param {string} userId - The user ID
 * @param {string} query - The natural language query
 * @param {Object} tools - Todo operation tools
 * @returns {Promise<string>} - The response to the user
 */
async function processNaturalLanguageRequest(userId, query, tools) {
  if (!openaiClient) {
    console.error('Cannot process request: OpenAI client not initialized');
    return "Sorry, the AI service is not available right now.";
  }

  // Function to get current time in Bangladesh
  function getBangladeshDateTime() {
    const options = {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true // Use AM/PM format
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(new Date());
  }

  try {
    // First, fetch all todos for this user to include in the prompt
    const userTodos = await aiTools.getAllTodos({ userId });
    
    // Create a comma-separated list of todo titles
    let todoNamesList = "";
    if (userTodos && userTodos.data && userTodos.data.length > 0) {
      todoNamesList = userTodos.data.map(todo => todo.title).join(", ");
    } else if (userTodos && userTodos.todos && userTodos.todos.length > 0) {
      todoNamesList = userTodos.todos.map(todo => todo.title).join(", ");
    } else {
      todoNamesList = "No todos available";
    }
    
    console.log(`Todo names for user ${userId}: ${todoNamesList}`);

    // Define the system prompt with the user ID, current date/time, and todo list
    const SYSTEM_PROMPT = `
You are an AI To-Do List Assistant named TodoBot. You help users manage their todos by understanding their natural language requests.
You can add, view, update, and delete todos.

Current information:
- Current date and time in Bangladesh: ${getBangladeshDateTime()} (Asia/Dhaka timezone GMT+6)
- User ID: ${userId} (this is automatically included in all requests, you don't need to specify it)
- Here are the current todo names available for this user: ${todoNamesList}

Personality and response style:
- You are friendly, helpful and efficient
- ALWAYS address the user as "boss" in every response
- Use a conversational, natural tone as if you're their personal assistant
- Include appropriate emojis in your responses (1-2 per message)
- NO MARKDOWN FORMATTING - do not use stars (*) or any other markdown symbols
- NO BOLD TEXT - never use ** or * around text
- Present information in a clean, organized way using numbers and bullet points for lists
- ALWAYS show dates in Bangladesh timezone (GMT+6) with AM/PM format
- Be concise but friendly

Task handling:
- VERY IMPORTANT: Do NOT automatically search for todos when a keyword in user's message matches a todo title
- DO NOT respond with todo information unless the user EXPLICITLY asks about their todos
- Act as a normal chatbot first - only access the todo list when specifically asked to
- Only search for todos when the user clearly asks something like "show me my todos about X" or "do I have any todos about Y?"
- For any request to update, reschedule, or change a todo: immediately use the getAllTodos action first to get the list, then use updateTodo to modify it
- For rescheduling, always use the updateTodo action with a new deadline
- If the user mentions updating a specific task (by name or context), identify the task and update it directly
- If it's not clear which task the user is referring to, check the list of todo names above and try to match to the closest one
- When the user refers vaguely to a task (like "meeting"), check the todo names list first for a matching task
- When mentioning dates or times, always use Bangladesh timezone (GMT+6) with AM/PM format
- IMPORTANT: Maintain context of previous messages and understand when the user is referring to todos mentioned earlier
- When the user refers to a todo without naming it specifically (like saying "change it"), figure out which todo they mean from previous conversation
- When deleting a todo, ALWAYS run getAllTodos first to get the correct ID

Todo DB Schema matches the actual database:
- id: UUID and primary key
- title: STRING (required)
- description: STRING 
- is_completed: BOOLEAN
- priority: INTEGER
  • High Priority: Greater than 8 (priority > 8)
  • Medium Priority: Between 5 and 8 inclusive (5 <= priority <= 8)
  • Low Priority: Less than 5 (priority < 5)
- deadline: Date Time (required in ISO format)
- user_id: UUID 
- created_at: Date Time
- updated_at: Date Time

Available tools:
- getAllTodos(params): Returns all the user's todos. The userId is automatically included.
- createTodo(params): Creates a new todo. 
  Required fields: title and deadline. 
  For priority: High Priority: > 8, Medium Priority: 5-8, Low Priority: < 5 (default: 3 - Low)
- updateTodo(params): Updates a specific todo.
  Required fields: todoId
  Optional fields: title, description, is_completed, priority, deadline
- deleteTodo(params): Deletes a todo.
  Required fields: todoId
- searchTodos(params): Searches for todos matching the query string
  Required fields: query

Respond in this JSON format:
For planning: {"type":"assistant","message":"PLAN: your plan here"}
For actions: {"type":"assistant","action":"actionName","params":{paramObject}}
For observations: {"type":"assistant","message":"Observation: result of action"}
For final output: {"type":"assistant","message":"OUTPUT: your response to user"}

IMPORTANT: When returning an OUTPUT response, never use markdown formatting with * or ** symbols. Use plain text only.
`;

    // Get or initialize conversation history for this user
    if (!conversationHistories.has(userId)) {
      conversationHistories.set(userId, []);
    }
    const conversationHistory = conversationHistories.get(userId);
    
    // Set up messages for the conversation with history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    
    // Add previous conversation history
    for (const historyItem of conversationHistory) {
      messages.push(historyItem);
    }

    // Add user query
    const userMessage = {
      type: "user",
      user: query,
    };
    const userMessageFormatted = { role: "user", content: JSON.stringify(userMessage) };
    messages.push(userMessageFormatted);

    // Add this message to history
    conversationHistory.push(userMessageFormatted);
    
    // Trim history if needed
    while (conversationHistory.length > MAX_HISTORY_LENGTH) {
      conversationHistory.shift();
    }
    
    let finalResponse = '';
    
    // Continue the conversation loop until we get a final output
    while (true) {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini", // Using 4o-mini per requirements
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = response.choices[0].message.content;
      const assistantMessage = { role: "assistant", content: result };
      messages.push(assistantMessage);
      
      // Add this response to history too
      conversationHistory.push(assistantMessage);
      
      // Trim history if needed
      while (conversationHistory.length > MAX_HISTORY_LENGTH) {
        conversationHistory.shift();
      }

      console.log(`OpenAI Response:`, result);

      try {
        const action = JSON.parse(result);
        
        // Check if this is a message that looks like a final output
        if (action.type === "assistant" && action.message && action.message.startsWith("OUTPUT:")) {
          finalResponse = action.message.substring(7).trim(); // Remove "OUTPUT: " prefix
          
          // Format the response nicely, especially for todo lists
          if (finalResponse.includes("tasks:") && finalResponse.includes("No tasks found")) {
            finalResponse = "You don't have any tasks yet. Would you like to create one?";
          }
          
          // Clean and format before returning
          finalResponse = cleanAndFormatResponse(finalResponse);
          break;
        } 
        // Check if this is an action to execute a tool
        else if (action.type === "assistant" && action.action) {
          console.log(`Executing action: ${action.action} with params including userId:`, {...action.params, userId});
          
          let observation;
          
          // Check if we need to lookup a todo first
          if ((action.action === 'updateTodo' || action.action === 'deleteTodo') && 
              (!action.params.todoId || action.params.todoId === '')) {
            console.log('No todoId provided, getting todos first to find the right one');
            const todosResult = await aiTools.getAllTodos({userId});
            if (!todosResult.error && todosResult.todos && todosResult.todos.length > 0) {
              console.log('Available todo IDs:');
              todosResult.todos.forEach(todo => {
                console.log(`Todo ID: ${todo.id} - Title: ${todo.title}`);
              });
            }
          }
          
          // Map the functions to our available tools
          switch (action.action) {
            case 'getAllTodos':
              observation = await aiTools.getAllTodos({userId});
              
              // Log the number of todos found
              if (observation.todos) {
                console.log(`Found ${observation.todos.length} todos for user ${userId}`);
                // Log each todo's ID for reference
                observation.todos.forEach(todo => {
                  console.log(`Todo ID: ${todo.id} - Title: ${todo.title}`);
                });
              } else {
                console.log(`Error getting todos for user ${userId}:`, observation.error);
              }
              break;
              
            case 'createTodo':
              if (typeof action.params === 'string') {
                // Simple string input for quick creation
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                observation = await aiTools.createTodo({
                  userId,
                  title: action.params,
                  description: '',
                  deadline: tomorrow.toISOString(),
                  priority: 3
                });
              } else {
                // Object input with more details
                observation = await aiTools.createTodo({
                  ...action.params,
                  userId
                });
              }
              
              // Log the created todo
              if (observation.todo) {
                console.log(`Created todo: ${observation.todo.title} with ID: ${observation.todo.id}`);
              } else {
                console.log(`Error creating todo:`, observation.error);
              }
              break;
              
            case 'updateTodo':
              if (!action.params.todoId) {
                // Get all todos first to find the right one
                const todosResult = await aiTools.getAllTodos({userId});
                if (!todosResult.error && todosResult.todos && todosResult.todos.length > 0) {
                  // For debugging, log all available todos
                  console.log('Available todos:');
                  todosResult.todos.forEach(todo => {
                    console.log(`Todo ID: ${todo.id} - Title: ${todo.title}`);
                  });
                  
                  // Add a note to the observation to tell the AI about the missing ID
                  observation = { error: 'No todoId provided, please select from available todos' };
                } else {
                  observation = { error: 'Failed to get todos to find the right one' };
                }
              } else {
                observation = await aiTools.updateTodo({
                  userId,
                  todoId: action.params.todoId,
                  ...action.params
                });
              }
              
              // Log the update request
              if (observation.todo) {
                console.log(`Updated todo: ${action.params.todoId} - ${observation.todo.title}`);
              } else {
                console.log(`Error updating todo:`, observation.error);
              }
              break;
              
            case 'deleteTodo':
              if (!action.params.todoId) {
                // Get all todos first to find the right one
                const todosResult = await aiTools.getAllTodos({userId});
                if (!todosResult.error && todosResult.todos && todosResult.todos.length > 0) {
                  // For debugging, log all available todos
                  console.log('Available todos:');
                  todosResult.todos.forEach(todo => {
                    console.log(`Todo ID: ${todo.id} - Title: ${todo.title}`);
                  });
                  
                  // Add a note to the observation to tell the AI about the missing ID
                  observation = { error: 'No todoId provided, please select from available todos' };
                } else {
                  observation = { error: 'Failed to get todos to find the right one' };
                }
              } else {
                observation = await aiTools.deleteTodo({
                  userId,
                  todoId: action.params.todoId
                });
              }
              
              // Log the delete request
              if (observation.success) {
                console.log(`Deleted todo: ${action.params.todoId}`);
              } else {
                console.log(`Error deleting todo:`, observation.error);
              }
              break;
              
            case 'searchTodos':
              observation = await aiTools.searchTodos({
                userId,
                query: action.params.query || action.params
              });
              
              // Log the search results
              if (observation.todos) {
                console.log(`Search found ${observation.todos.length} todos matching query: ${action.params.query || action.params}`);
                // Log each todo's ID for reference
                observation.todos.forEach(todo => {
                  console.log(`Todo ID: ${todo.id} - Title: ${todo.title}`);
                });
              } else {
                console.log(`Error searching todos:`, observation.error);
              }
              break;
              
            default:
              observation = { error: 'Unknown function' };
              console.error(`Unknown function requested: ${action.action}`);
          }
          
          // Add the observation to the messages
          const observationMessage = {
            type: 'assistant',
            message: `Observation: ${JSON.stringify(observation)}`
          };
          const formattedObservation = { role: 'user', content: JSON.stringify(observationMessage) };
          messages.push(formattedObservation);
          
          // Add this observation to history too
          conversationHistory.push(formattedObservation);
          
          // Trim history if needed
          while (conversationHistory.length > MAX_HISTORY_LENGTH) {
            conversationHistory.shift();
          }
          
          // If there was an error in the observation, log it
          if (observation && observation.error) {
            console.error(`Error in ${action.action}:`, observation.error);
          }
        }
        // If it's just a regular planning message or other message, continue the conversation
        else if (action.type === "assistant" && action.message) {
          // Only continue if it explicitly mentions PLAN or Observation
          if (action.message.startsWith("PLAN:") || action.message.startsWith("Observation:")) {
            continue;
          }
          // Otherwise treat it as final output
          else {
            finalResponse = action.message;
            // Clean and format before returning
            finalResponse = cleanAndFormatResponse(finalResponse);
            break;
          }
        }
        // If we can't parse or handle the response, provide a default response
        else {
          finalResponse = "I'm not sure how to process that request. Could you try again with different wording?";
          break;
        }
      } catch (error) {
        console.error('Error processing AI response:', error);
        finalResponse = "Sorry, I had trouble understanding that. Could you try again?";
        break;
      }
    }
    
    // Clean and format the final response before returning
    return cleanAndFormatResponse(finalResponse);
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    return "Sorry, I encountered an error processing your request. Please try again later.";
  }
}

// Process the AI response
async function processAIResponse(userId, message, response) {
  try {
    console.log(`Processing AI response for user ${userId}`);
    
    // If the user message contains a command to list todos, we should just do that
    if (message && message.toLowerCase().includes('list') && message.toLowerCase().includes('todo')) {
      console.log(`Direct list command detected from: ${message}`);
      try {
        // Get all todos
        const result = await aiTools.getAllTodos({ userId });
        console.log(`Direct getAllTodos result:`, result);
        
        if (result.error) {
          console.error('Error listing todos:', result.error);
          return cleanAndFormatResponse(`Sorry boss, I couldn't list your todos. Error: ${result.error}`);
        }
        
        if (!result.todos || result.todos.length === 0) {
          return "You don't have any tasks yet, boss! Would you like to create one? 📝";
        }
        
        // Log each todo for debugging
        result.todos.forEach(todo => {
          console.log(`Todo: ${todo.id} - ${todo.title} - ${todo.deadline}`);
        });
        
        // Format todos for display in a clean format with Bangladesh timezone
        const todoList = result.todos.map((todo, index) => {
          // Use the helper function to format dates in Bangladesh timezone
          const deadline = formatBangladeshDateTime(todo.deadline);
          const isCompleted = todo.is_completed === 'Yes' || todo.is_completed === true;
          const priority = parseInt(todo.priority) || 3;
          const priorityText = priority <= 2 ? 'High' : (priority <= 4 ? 'Medium' : 'Low');
          
          return `${index + 1}. ${todo.title}\n   • Deadline: ${deadline}\n   • Priority: ${priorityText} (${priority})\n   • Completed: ${isCompleted ? '✅' : '❌'}`;
        }).join('\n\n');
        
        return cleanAndFormatResponse(`Here are your tasks, boss!\n\n${todoList}`);
      } catch (directError) {
        console.error('Error in direct list command:', directError);
        return cleanAndFormatResponse("I had trouble retrieving your tasks, boss. Please try again.");
      }
    }
    
    // Check if response exists and has content
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('Invalid response structure:', response);
      return cleanAndFormatResponse("I received an invalid response structure, boss. Please try again.");
    }
    
    try {
      // Extract content from the AI response
      const content = response.choices[0].message.content;
      console.log('Raw content from OpenAI:', content);
      
      // First try to parse the content as JSON
      try {
        const parsedJSON = JSON.parse(content);
        console.log('Successfully parsed JSON from AI response:', parsedJSON);
        
        // Process based on type
        if (parsedJSON.type === 'assistant') {
          // Handle output message
          if (parsedJSON.message && parsedJSON.message.startsWith('OUTPUT:')) {
            const outputText = parsedJSON.message.substring(7).trim();
            return cleanAndFormatResponse(outputText);
          }
          
          // Handle regular message
          if (parsedJSON.message) {
            return cleanAndFormatResponse(parsedJSON.message);
          }
          
          // Handle action
          if (parsedJSON.action) {
            // Make sure we have the user ID in params
            const actionParams = { ...parsedJSON.params, userId };
            console.log(`Executing action from JSON: ${parsedJSON.action}`, actionParams);
            
            // Get list of todos first for reference if needed
            if (parsedJSON.action === 'updateTodo' || parsedJSON.action === 'deleteTodo') {
              try {
                const todos = await aiTools.getAllTodos({ userId });
                if (todos && todos.todos) {
                  console.log('Available todos for reference:');
                  todos.todos.forEach(todo => {
                    console.log(`- Todo: ${todo.id} | ${todo.title}`);
                  });
                }
              } catch (error) {
                console.error('Error fetching todos for reference:', error);
              }
            }
            
            // Execute the action
            return await executeAction(parsedJSON.action, actionParams);
          }
        }
        
        // If we didn't handle it above, just format it
        return cleanAndFormatResponse(content);
      } catch (jsonError) {
        console.log('Not valid JSON, treating as text:', jsonError);
        return cleanAndFormatResponse(content);
      }
    } catch (contentError) {
      console.error('Error processing content:', contentError);
      return cleanAndFormatResponse("I had trouble processing the response, boss. Let's try a different approach.");
    }
  } catch (finalError) {
    console.error('Critical error in processAIResponse:', finalError);
    return cleanAndFormatResponse("I encountered an error processing your request, boss. Please try again.");
  }
}

// Helper function to format date in Bangladesh timezone - moved outside for reuse
function formatBangladeshDateTime(dateString) {
  if (!dateString) return 'No deadline';
  
  try {
    // Create date object and convert to Bangladesh time (GMT+6)
    const date = new Date(dateString);
    
    // Format options for Bangladesh time
    const options = {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true // Use AM/PM format
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original if parsing fails
  }
}

// Helper function to execute an action
async function executeAction(actionName, params) {
  console.log(`Executing action: ${actionName} with params:`, params);
  
  // Function to format date in Bangladesh timezone
  function formatBangladeshDateTime(dateString) {
    if (!dateString) return 'No deadline';
    
    try {
      // Create date object and convert to Bangladesh time (GMT+6)
      const date = new Date(dateString);
      
      // Format options for Bangladesh time
      const options = {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Use AM/PM format
      };
      
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original if parsing fails
    }
  }
  
  try {
    let result;
    
    switch (actionName) {
      case 'getAllTodos':
        result = await aiTools.getAllTodos(params);
        console.log(`getAllTodos result:`, result);
        
        if (result.error) {
          return `I couldn't retrieve your tasks, boss. Error: ${result.error} 😔`;
        }
        
        if (!result.todos || result.todos.length === 0) {
          return "You don't have any tasks yet, boss! Would you like to create one? 📝";
        }
        
        // Format todos for display in a clean, friendly format with Bangladesh time
        const todoList = result.todos.map((todo, index) => {
          const deadline = formatBangladeshDateTime(todo.deadline);
          const isCompleted = todo.is_completed === 'Yes' || todo.is_completed === true;
          const priority = parseInt(todo.priority);
          const priorityText = priority <= 2 ? 'High' : (priority <= 4 ? 'Medium' : 'Low');
          
          return `${index + 1}. ${todo.title}\n   • Deadline: ${deadline}\n   • Priority: ${priorityText} (${priority})\n   • Completed: ${isCompleted ? '✅' : '❌'}`;
        }).join('\n\n');
        
        return `Here are your tasks, boss! 📋\n\n${todoList}`;
        
      case 'createTodo':
        result = await aiTools.createTodo(params);
        
        if (result.error) {
          return `I couldn't create the task, boss. Error: ${result.error} 😔`;
        }
        
        return `Great! I've added "${result.todo.title}" to your tasks, boss! ✅`;
        
      case 'updateTodo':
        result = await aiTools.updateTodo(params);
        
        if (result.error) {
          return `I couldn't update the task, boss. Error: ${result.error} 😔`;
        }
        
        const changes = [];
        if (params.title) changes.push(`title to "${params.title}"`);
        if (params.description) changes.push(`description`);
        if (params.is_completed !== undefined) changes.push(`status to ${params.is_completed ? 'completed' : 'not completed'}`);
        if (params.priority) changes.push(`priority to ${params.priority}`);
        if (params.deadline) {
          changes.push(`deadline to ${formatBangladeshDateTime(params.deadline)}`);
        }
        
        const changesText = changes.length > 0 
          ? ` I updated the ${changes.join(', ')}.` 
          : '';
        
        return `I've updated the task "${result.todo.title}", boss!${changesText} ✅`;
        
      case 'deleteTodo':
        result = await aiTools.deleteTodo(params);
        
        if (result.error) {
          return `I couldn't delete the task, boss. Error: ${result.error} 😔`;
        }
        
        return `I've deleted the task successfully, boss! ✅`;
        
      case 'searchTodos':
        result = await aiTools.searchTodos(params);
        
        if (result.error) {
          return `I couldn't search for tasks, boss. Error: ${result.error} 😔`;
        }
        
        if (!result.todos || result.todos.length === 0) {
          return `I couldn't find any tasks matching "${params.query}", boss. 🔍`;
        }
        
        // Format todos for display in a clean, friendly format with Bangladesh time
        const matchedTodoList = result.todos.map((todo, index) => {
          const deadline = formatBangladeshDateTime(todo.deadline);
          const isCompleted = todo.is_completed === 'Yes' || todo.is_completed === true;
          const priority = parseInt(todo.priority);
          const priorityText = priority <= 2 ? 'High' : (priority <= 4 ? 'Medium' : 'Low');
          
          return `${index + 1}. ${todo.title}\n   • Deadline: ${deadline}\n   • Priority: ${priorityText} (${priority})\n   • Completed: ${isCompleted ? '✅' : '❌'}`;
        }).join('\n\n');
        
        return `Here are the tasks matching "${params.query}", boss! 🔍\n\n${matchedTodoList}`;
        
      default:
        return `I don't know how to ${actionName}, boss. Please try something else. 🤔`;
    }
  } catch (error) {
    console.error(`Error executing action ${actionName}:`, error);
    return `I encountered an error while trying to ${actionName}, boss. Please try again. 😔`;
  }
}

module.exports = {
  initOpenAIClient,
  getOpenAIClient,
  processNaturalLanguageRequest,
  processAIResponse
}; 