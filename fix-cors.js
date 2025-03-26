/*
FIX FOR NGROK API WITH REACT

The issue you're experiencing is that your React app can login and create todos with ngrok, 
but can't fetch existing data. This is because of how the JWT token is being used.

To fix this issue, follow these steps in your React application:

1. ALWAYS USE THE SAME DOMAIN FOR ALL REQUESTS

   When you log in through ngrok, always use ngrok for all API requests.
   The same applies to localhost - when using localhost, use it for all requests.

   Bad pattern:
   - Login at http://localhost:3000/api/auth/login
   - Then fetch todos from https://8298-103-145-119-103.ngrok-free.app/api/todos

   Good pattern:
   - Login at https://8298-103-145-119-103.ngrok-free.app/api/auth/login
   - Then fetch todos from https://8298-103-145-119-103.ngrok-free.app/api/todos

2. ENSURE YOUR API CLIENT IS CONSISTENT

   In your React app, make sure you're using the environment variable consistently:

   ```javascript
   // src/api/index.js or similar file
   import axios from 'axios';

   const API_URL = import.meta.env.VITE_API_URL;
   
   const api = axios.create({
     baseURL: API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   });
   
   // Add request interceptor to include auth token
   api.interceptors.request.use(
     (config) => {
       const token = localStorage.getItem('token');
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
       return config;
     },
     (error) => Promise.reject(error)
   );
   
   export default api;
   ```

3. USE THIS API CLIENT EVERYWHERE

   Make sure all your components use this API client:

   ```javascript
   // In any component
   import api from '../api';
   
   // Fetch todos
   const fetchTodos = async () => {
     try {
       const response = await api.get('/todos');
       setTodos(response.data);
     } catch (error) {
       console.error('Error fetching todos:', error);
     }
   };
   ```

4. ENSURE YOU STORE THE TOKEN AFTER LOGIN

   ```javascript
   const login = async (username, password) => {
     try {
       const response = await api.post('/auth/login', { username, password });
       localStorage.setItem('token', response.data.access_token);
       // Other login logic...
     } catch (error) {
       console.error('Login error:', error);
     }
   };
   ```

5. CHECK YOUR BROWSER CONSOLE FOR ERRORS

   Open the browser's developer tools (F12) and check the Console tab for
   any errors related to CORS or authentication when making requests.

6. CLEAR LOCAL STORAGE WHEN CHANGING DOMAINS

   When switching between localhost and ngrok, clear your browser's localStorage:
   
   In Chrome Dev Tools:
   1. Open Application tab
   2. Select Local Storage on the left
   3. Right-click your app's domain and select "Clear"
   4. Refresh the page

By following these steps, you should be able to use your React app with the ngrok API
without any issues.
*/ 