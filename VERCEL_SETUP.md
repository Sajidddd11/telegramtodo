# Vercel Deployment Setup

This guide contains instructions for deploying the Todo API with Telegram integration to Vercel.

## Step 1: Prerequisites

Before deploying to Vercel, make sure you have:

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Telegram bot token (from [BotFather](https://t.me/botfather))
3. Your Supabase URL and key
4. A JWT secret (you can generate one using a secure random generator)
5. An OpenAI API key (sign up at [platform.openai.com](https://platform.openai.com))

## Step 2: Set Environment Variables

In Vercel, you need to set the following environment variables:

1. `SUPABASE_URL` - Your Supabase project URL
2. `SUPABASE_KEY` - Your Supabase service role key
3. `JWT_SECRET` - Your JWT secret for token signing
4. `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
5. `TELEGRAM_WEBHOOK_URL` - Should be `https://your-vercel-domain.vercel.app/api/telegram/webhook`
6. `BOT_MODE` - Set to `webhook` for production
7. `NODE_ENV` - Set to `production`
8. `OPENAI_API_KEY` - Your OpenAI API key for natural language processing

## Deployment Steps

1. **Deploy Your Project**

   Use the Vercel CLI or GitHub integration to deploy your project.

2. **Set Up Telegram Webhook**

   After your project is deployed, run the following command to set up the webhook:

   ```
   curl -F "url=https://your-vercel-url.vercel.app/api/telegram/webhook" https://api.telegram.org/bot{your_telegram_bot_token}/setWebhook
   ```

   Replace `your-vercel-url.vercel.app` with your actual Vercel URL and `{your_telegram_bot_token}` with your actual bot token.

3. **Verify the Deployment**

   Test the API by visiting these endpoints:

   - Health check: `https://your-vercel-url.vercel.app/`
   - Test endpoint: `https://your-vercel-url.vercel.app/test`

4. **Check Webhook Status**

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