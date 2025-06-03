# Railway Deployment Guide

This guide provides comprehensive instructions for deploying the Darvaya AI Chatbot on Railway, a modern cloud platform for running applications and databases.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Deployment](#detailed-deployment)
  - [Option 1: One-Click Deploy](#option-1-one-click-deploy)
  - [Option 2: Manual Deployment](#option-2-manual-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [File Storage](#file-storage)
- [Scaling](#scaling)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

1. A [Railway account](https://railway.app/) (free tier available)
2. A GitHub account with access to this repository
3. Node.js 18+ and pnpm installed locally for development
4. (Optional) [Railway CLI](https://docs.railway.app/develop/cli) for advanced workflows

## Quick Start

For a quick deployment:

1. Click the "Deploy on Railway" button below:
   
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2Fdarvaya%2Fdarvaya-ai-chatbot)

2. Follow the setup wizard to configure your environment variables
3. Wait for deployment to complete
4. Your application will be live at the provided Railway URL

## Detailed Deployment

### Option 1: One-Click Deploy

1. Click the "Deploy on Railway" button above
2. Sign in or create a Railway account
3. Select your GitHub account and repository
4. Configure environment variables (see below for required values)
5. Click "Deploy"
6. Wait for the deployment to complete

### Option 2: Manual Deployment

#### 1. Install Railway CLI (Optional but Recommended)

```bash
npm i -g @railway/cli
```

#### 2. Login to Railway

```bash
railway login
```

#### 3. Create a New Project

```bash
railway init
```

#### 4. Add Required Services

```bash
# Add PostgreSQL database
railway add --plugin postgresql

# Add Redis (optional, for rate limiting and caching)
railway add --plugin redis
```

#### 5. Link Your Project

```bash
railway link
```

#### 6. Set Environment Variables

Set required environment variables:

```bash
# Basic configuration
railway variables set NODE_ENV=production
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=$(railway variables get RAILWAY_PUBLIC_DOMAIN)

# Database (auto-configured when adding PostgreSQL plugin)
railway variables set DATABASE_URL=$(railway variables get DATABASE_URL)

# OpenAI API Key (required)
railway variables set OPENAI_API_KEY=your-openai-api-key

# AWS S3 for file storage (optional but recommended)
railway variables set AWS_ACCESS_KEY_ID=your-aws-access-key
railway variables set AWS_SECRET_ACCESS_KEY=your-aws-secret-key
railway variables set AWS_REGION=your-aws-region
railway variables set AWS_S3_BUCKET=your-s3-bucket-name

# Google OAuth (optional)
railway variables set GOOGLE_CLIENT_ID=your-google-client-id
railway variables set GOOGLE_CLIENT_SECRET=your-google-client-secret

# Analytics (optional)
railway variables set NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
railway variables set NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Error Tracking (optional)
railway variables set NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

#### 7. Deploy Your Application

```bash
git push railway main
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `NEXTAUTH_SECRET` | Random string for session encryption |
| `NEXTAUTH_URL` | Base URL of your application |
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | Your OpenAI API key |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_*` | AWS S3 configuration for file storage | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | - |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL | - |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | - |
| `REDIS_URL` | Redis connection URL | - |

## Database Setup

1. After deployment, run database migrations:
   ```bash
   railway run pnpm db:push
   ```

2. For production, consider:
   - Setting up regular backups
   - Enabling connection pooling
   - Configuring read replicas for read-heavy workloads

## File Storage

For file uploads, configure AWS S3 or a compatible service:

1. Create an S3 bucket
2. Generate access keys with appropriate permissions
3. Set the following environment variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`

## Scaling

Railway automatically scales your application based on traffic. For advanced scaling:

1. Go to your Railway project
2. Navigate to the "Settings" tab
3. Adjust scaling settings as needed

## Monitoring

Railway provides built-in monitoring:

- **Logs**: View application logs in real-time
- **Metrics**: Monitor CPU, memory, and network usage
- **Alerts**: Set up alerts for errors or resource usage

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify `DATABASE_URL` is correctly set
   - Check if the database is running and accessible

2. **Environment Variables**
   - Ensure all required variables are set
   - Restart the service after changing variables

3. **Build Failures**
   - Check the build logs for specific errors
   - Ensure all dependencies are properly installed

### Getting Help

For additional support:
1. Check the [Railway documentation](https://docs.railway.app/)
2. Join the [Railway Discord](https://discord.gg/railway)
3. Open an issue in the GitHub repository
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
