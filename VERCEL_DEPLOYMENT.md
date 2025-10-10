# Vercel Deployment Guide

## Prerequisites

1. A Vercel account
2. An Unsplash API access key

## Getting an Unsplash API Key

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Copy the "Access Key" from your application dashboard

## Setting Environment Variables on Vercel

### Option 1: Via Vercel Dashboard

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `UNSPLASH_ACCESS_KEY`
   - **Value**: Your Unsplash Access Key
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Option 2: Via Vercel CLI

```bash
vercel env add UNSPLASH_ACCESS_KEY
# When prompted, enter your Unsplash Access Key
# Select all environments (production, preview, development)
```

## Redeploying After Setting Environment Variables

After adding environment variables, you need to redeploy:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard by going to **Deployments** and clicking **Redeploy** on the latest deployment.

## Testing the Deployment

1. Open your deployed app URL
2. Try creating a new curriculum with some words
3. The flashcards should generate successfully with images from Unsplash

## Troubleshooting

### Issue: "Failed to generate flashcards"

**Possible Causes:**
1. **Missing Environment Variable**: The `UNSPLASH_ACCESS_KEY` is not set on Vercel
   - **Solution**: Follow the steps above to set the environment variable
   - **Verify**: Check the Vercel dashboard under Settings → Environment Variables

2. **Invalid API Key**: The Unsplash API key is invalid or expired
   - **Solution**: Generate a new API key from Unsplash Developers
   - **Verify**: Test your API key locally first

3. **Unsplash API Rate Limit**: You've exceeded the free tier limit (50 requests/hour)
   - **Solution**: Wait an hour or upgrade your Unsplash plan
   - **Verify**: Check the Vercel function logs for rate limit errors

4. **Function Timeout**: The function is timing out (Vercel free tier: 10s limit)
   - **Solution**: Reduce the number of words per curriculum
   - **Note**: The function processes words in batches of 3 to manage load

### Viewing Vercel Function Logs

1. Go to your project on Vercel Dashboard
2. Navigate to **Deployments** → Click on the latest deployment
3. Click on **Functions** → Select the `generate.ts` function
4. View the logs to see detailed error messages

### Testing Locally

To test the serverless functions locally:

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Create a .env file (don't commit this!)
echo "UNSPLASH_ACCESS_KEY=your_key_here" > .env

# Run Vercel dev server
vercel dev
```

## Important Notes

1. **Caching**: In-memory caching doesn't work on Vercel's serverless functions. Each invocation starts fresh. The cache endpoints are provided for compatibility but won't have any effect.

2. **Rate Limits**: Unsplash free tier allows 50 requests per hour. Each word in a curriculum makes one API request.

3. **Function Timeout**: Vercel free tier has a 10-second function timeout. Pro accounts get 60 seconds.

4. **Cold Starts**: First request after inactivity may be slower due to cold starts.

## Architecture Notes

The Vercel deployment uses serverless functions in the `/api` directory:
- `/api/flashcards/generate.ts` - Main flashcard generation endpoint
- `/api/cache/clear-all.ts` - Cache clearing (no-op on Vercel)
- `/api/cache/clear-words.ts` - Word cache clearing (no-op on Vercel)
- `/api/cache/stats.ts` - Cache statistics (always returns 0 on Vercel)

For local development, use the Express server in `/server` which supports in-memory caching.

