# Frontend Integration Guide

This guide explains how to integrate your new backend with the existing React frontend.

## Step 1: Update API URLs

In your React frontend, you'll need to replace all instances of the existing API URL (`https://5nvfy5p7we.execute-api.ap-south-1.amazonaws.com/dev`) with your new backend URL (e.g., `http://localhost:3000/api`).

Here are the main files that need to be updated:

1. `src/components/Login.tsx` - Login API call
2. `src/components/Create.tsx` - Registration API call
3. `src/components/Todo.tsx` - Todo CRUD operations
4. `src/components/CreateTodoModal.tsx` - Todo creation
5. `src/components/Dashboard.tsx` - Fetching todos
6. `src/components/Profile.tsx` - User profile operations

## Step 2: Update API Endpoints

The backend API endpoints have slightly different formats. Here's a mapping of old to new:

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/login` | `/api/auth/login` |
| `/register` | `/api/auth/register` |
| `/todos` | `/api/todos` |
| `/todo` | `/api/todos` |
| `/todo/:id` | `/api/todos/:id` |
| `/user` | `/api/users/profile` |
| `/user/password` | `/api/users/change-password` |

## Step 3: Update Authentication Headers

For all authenticated requests, ensure you're sending the JWT token in the Authorization header:

```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/todos', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

## Step 4: Update Login Handler

In the Login component, update the login handler to store the token:

```javascript
async function loginClick() {
  try {
    const body = {
      username: username,
      password: pass
    };
    
    const r = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const j = await r.json();
    if (j['access_token']) {
      localStorage.setItem('token', j.access_token); // Store the token
      localStorage.setItem('username', username);
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } else {
      toast.error(j['error']);
    }
  } catch (error) {
    toast.error('Login failed');
  }
}
```

## Step 5: Handle API Response Format Changes

Ensure you handle any differences in the response format between the old API and the new API. For example:

- The new API returns todos directly as an array, not wrapped in a data object
- Error messages use the key 'error' instead of 'detail'
- The success message for todo creation is in the format `{ message: 'Todo created successfully', todo: {...} }`

## Step 6: Test the Integration

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
npm run dev
```

3. Test all functionality:
   - Registration
   - Login
   - Creating todos
   - Updating todos
   - Deleting todos
   - Viewing todo statistics
   - Updating user profile

If you encounter any issues, check the browser console and the backend server logs for error messages. 