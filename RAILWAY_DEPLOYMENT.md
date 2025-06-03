# Railway Deployment Guide

This guide will walk you through deploying the Darvaya AI Chatbot on Railway.

## Prerequisites

1. A Railway account (https://railway.app)
2. A GitHub account with access to this repository
3. Node.js 18+ and pnpm installed locally for development
4. A PostgreSQL database (can be provisioned through Railway)
5. (Optional) Redis instance for caching/rate limiting

## Environment Variables

Copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for details on each variable.

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. The application will be available at http://localhost:3000

## Deployment to Railway

### Option 1: Deploy with Railway Button (Easiest)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2Fyourusername%2Fdarvaya-ai-chatbot&envs=NODE_ENV%2CNEXTAUTH_SECRET%2CNEXTAUTH_URL%2CDATABASE_URL%2CREDIS_URL%2COPENAI_API_KEY%2CNEXT_PUBLIC_GA_MEASUREMENT_ID%2CNEXT_PUBLIC_POSTHOG_KEY%2CNEXT_PUBLIC_POSTHOG_HOST&optionalEnvs=REDIS_URL%2CNEXT_PUBLIC_GA_MEASUREMENT_ID%2CNEXT_PUBLIC_POSTHOG_KEY%2CNEXT_PUBLIC_POSTHOG_HOST)

### Option 2: Manual Deployment

1. Install the Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   railway link
   ```

4. Deploy your application:
   ```bash
   railway up
   ```

## Environment Variables

### Required Variables

- `NODE_ENV` - Application environment (development, production, test)
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js
- `NEXTAUTH_URL` - Base URL of your application
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key

### Optional Variables

- `REDIS_URL` - Redis connection URL (for rate limiting/caching)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics 4 Measurement ID
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL

## Database Setup

1. Create a new PostgreSQL database on Railway
2. Run migrations:
   ```bash
   pnpm migrate
   ```

## Continuous Deployment

This repository includes a GitHub Actions workflow that automatically deploys to Railway when changes are pushed to the `main` branch. To set it up:

1. Add the following secrets to your GitHub repository (Settings > Secrets > Actions):
   - `RAILWAY_TOKEN` - Your Railway API token
   - `RAILWAY_PROJECT_ID` - Your Railway project ID
   - `RAILWAY_PRODUCTION_SERVICE_ID` - Your production service ID
   - `RAILWAY_STAGING_SERVICE_ID` - (Optional) Staging service ID

## Monitoring and Logs

- Access logs through the Railway dashboard
- Set up alerts in Railway for error tracking
- Integrate with Sentry for error monitoring (configure `SENTRY_DSN`)

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check if the database is accessible from Railway's network
   - Run migrations if tables don't exist

2. **Authentication Problems**
   - Ensure `NEXTAUTH_SECRET` is set and consistent
   - Verify `NEXTAUTH_URL` matches your deployment URL

3. **Build Failures**
   - Check the build logs in Railway
   - Ensure all environment variables are set
   - Verify Node.js version compatibility

## Support

For additional help, please contact the development team or open an issue in the repository.
