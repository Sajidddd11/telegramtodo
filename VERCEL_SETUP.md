# Vercel Deployment Setup

This guide contains instructions for deploying the Todo API with Telegram integration to Vercel.

## Prerequisites

- A Vercel account
- The Telegram bot token
- Your Supabase credentials
- Your JWT secret

## Deployment Steps

1. **Set up Environment Variables in Vercel**

   In your project settings on Vercel, add the following environment variables:

   ```
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   NODE_ENV=production
   ```

2. **Deploy Your Project**

   Use the Vercel CLI or GitHub integration to deploy your project.

3. **Set Up Telegram Webhook**

   After your project is deployed, run the following command to set up the webhook:

   ```
   curl -F "url=https://your-vercel-url.vercel.app/api/telegram/webhook" https://api.telegram.org/bot{your_telegram_bot_token}/setWebhook
   ```

   Replace `your-vercel-url.vercel.app` with your actual Vercel URL and `{your_telegram_bot_token}` with your actual bot token.

4. **Verify the Deployment**

   Test the API by visiting these endpoints:

   - Health check: `https://your-vercel-url.vercel.app/`
   - Test endpoint: `https://your-vercel-url.vercel.app/test`

5. **Check Webhook Status**

   Verify that the webhook is set up correctly:

   ```
   curl https://api.telegram.org/bot{your_telegram_bot_token}/getWebhookInfo
   ```

## Troubleshooting

If your deployment isn't working:

1. **Check the Logs**

   In the Vercel dashboard, check the Function Logs for any errors.

2. **Verify Environment Variables**

   Make sure all environment variables are correctly set in Vercel.

3. **Test Basic Endpoints**

   Try accessing the test endpoint at `/test` to see if the basic API is working.

4. **Check Database Connectivity**

   Verify that your API can connect to Supabase by checking the logs.

5. **Review Webhook Setup**

   Make sure the Telegram webhook is correctly pointing to your API endpoint.

## Testing Telegram Integration

Use the `telegram-link-test.js` script to test the Telegram integration:

```
node telegram-link-test.js
```

When prompted, enter your Vercel URL as the API base URL. 