# Deploying the Todo Backend to Vercel

This guide will help you deploy your Todo backend application to Vercel serverless platform.

## Prerequisites

1. A Vercel account (https://vercel.com/signup)
2. Vercel CLI installed globally (optional, for local testing)
   ```
   npm install -g vercel
   ```

## Deployment Steps

### Method 1: Using Vercel CLI

1. Navigate to your project directory in the terminal
2. Login to Vercel (if not already logged in)
   ```
   vercel login
   ```
3. Run the deployment command
   ```
   vercel
   ```
4. Follow the prompts to configure your project
5. To deploy to production, use:
   ```
   vercel --prod
   ```

### Method 2: Using Vercel Dashboard

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Log in to the Vercel dashboard
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: None (leave empty)
   - Output Directory: None (leave empty)
6. Click "Deploy"

## Environment Variables

You need to set up the following environment variables in Vercel:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase API key
- `JWT_SECRET`: Your secret key for JWT authentication
- `PORT`: The port for local development (not required for Vercel deployment)

You can set these in the Vercel dashboard under Project Settings > Environment Variables.

## Testing the Deployment

After deployment, Vercel will provide a URL for your application. Test your API endpoints using this URL:

- Health check: `https://your-vercel-url.vercel.app/`
- API endpoints: `https://your-vercel-url.vercel.app/api/...`

## Troubleshooting

If you encounter issues with your deployment:

1. Check the Vercel deployment logs in the dashboard
2. Ensure all environment variables are properly set
3. Verify the Supabase connection is working properly
4. Test the API endpoints to make sure they're responding correctly

## Local Development with Vercel

To test your Vercel deployment locally:

1. Install the Vercel CLI: `npm install -g vercel`
2. Run: `vercel dev`

This will start a development server that mimics the Vercel production environment.

## Important Notes

- The serverless environment has certain limitations compared to traditional servers
- Each function invocation is isolated, so don't rely on global variables for state
- There are execution time limits (typically 10-60 seconds depending on your plan)
- Cold starts may occur if your function hasn't been invoked recently 