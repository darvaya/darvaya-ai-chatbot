# Darvaya AI Chatbot

<div align="center">
  <h1>Next.js AI Chatbot with Railway Deployment</h1>
</div>

<p align="center">
    Darvaya AI chatbot built with Next.js 14, featuring automatic deployment on Railway, PostgreSQL database, and Redis caching.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#deployment"><strong>Deploy on Railway</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text and structured objects
  - Hooks for building dynamic chat interfaces
  - Support for multiple AI model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com)
- Infrastructure
  - [Railway](https://railway.app) for deployment and infrastructure
  - PostgreSQL database (auto-provisioned by Railway)
  - Redis caching (auto-provisioned by Railway)
- [Auth.js](https://authjs.dev)
  - Secure authentication system
  - Role-based access control

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run database migrations:
```bash
pnpm migrate
```

4. Start development server:
```bash
pnpm dev
```

## Development

### Testing

Run all tests:
```bash
pnpm test
```

Run specific test suites:
```bash
pnpm test:unit        # Unit tests
pnpm test:integration # Integration tests
pnpm test:e2e        # End-to-end tests
pnpm test:coverage   # Coverage report
```

### Docker

Build and run with Docker:
```bash
pnpm docker:build
pnpm docker:run
```

### Documentation

Generate documentation:
```bash
pnpm docs
```

## Deployment

### Deploy on Railway

The fastest way to deploy is using the Railway deploy button:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/darvaya-ai-chatbot)

For manual deployment:

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link your project:
```bash
railway link
```

4. Set up environment variables in Railway dashboard:
- `DATABASE_URL`: PostgreSQL connection string (Railway will auto-provision)
- `REDIS_URL`: Redis connection string (Railway will auto-provision)
- `NEXT_PUBLIC_API_URL`: Your application's public URL
- Add other required environment variables from `.env.example`

5. Deploy your application:
```bash
railway up
```

### GitHub Actions Deployment

The application is configured to automatically deploy to Railway when changes are pushed to the main branch. To set this up:

1. Add the following secrets to your GitHub repository:
- `RAILWAY_TOKEN`: Your Railway API token
- `RAILWAY_SERVICE_NAME`: The name of your Railway service
- `SLACK_BOT_TOKEN`: (Optional) For deployment notifications

2. Push to the main branch or manually trigger the deployment workflow.

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests
4. Create pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).
