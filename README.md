# DarvayaAI Chatbot

A commercial-ready AI chatbot built with Next.js, featuring authentication, analytics, and monitoring.

## Features

- 🔐 Authentication with NextAuth.js and Google OAuth
- 📊 Analytics with PostHog
- 🔍 Error tracking with Sentry
- 💬 AI Chat with OpenAI GPT-4
- 🎨 Beautiful UI with Tailwind CSS
- 🚀 Edge Runtime Support
- 🔄 Real-time streaming responses
- 📱 Responsive design
- 🔒 Type-safe with TypeScript
- 🗄️ Database with PostgreSQL and Drizzle ORM
- 📁 File uploads with AWS S3 or S3-compatible storage

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Auth:** NextAuth.js
- **Database:** PostgreSQL
- **ORM:** Drizzle
- **Styling:** Tailwind CSS
- **Components:** Radix UI
- **Analytics:** PostHog
- **Monitoring:** Sentry
- **AI Provider:** OpenAI
- **Storage:** AWS S3 (or S3-compatible)
- **Deployment:** Railway

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (optional)
- pnpm
- AWS S3 bucket or S3-compatible storage (for file uploads)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/darvaya-ai-chatbot.git
cd darvaya-ai-chatbot
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your values.

### Environment Variables

Copy the `.env.example` file to `.env.local` and fill in the required variables.

#### File Storage Configuration

For file uploads, you'll need to configure AWS S3 or an S3-compatible service. Add these to your `.env.local`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: For S3-compatible services like DigitalOcean Spaces, Cloudflare R2, etc.
# AWS_ENDPOINT=https://your-endpoint.com
# AWS_FORCE_PATH_STYLE=true
# AWS_S3_PUBLIC_URL=https://your-cdn-url.com
```

5. Set up the database:
```bash
pnpm db:push
```

6. Start the development server:
```bash
pnpm dev
```

## Deployment

### Pre-deployment Checklist

1. **Environment Variables**
   - [ ] Set up production environment variables
   - [ ] Configure domain in NextAuth URL
   - [ ] Set up production database URL
   - [ ] Configure production Redis URL (if using)
   - [ ] Set up Sentry DSN
   - [ ] Configure PostHog keys

2. **Database**
   - [ ] Run database migrations
   - [ ] Verify database connection
   - [ ] Set up database backups

3. **Authentication**
   - [ ] Configure production OAuth credentials
   - [ ] Test authentication flow
   - [ ] Set up proper callback URLs

4. **Monitoring**
   - [ ] Configure Sentry environment
   - [ ] Set up error alerts
   - [ ] Configure performance monitoring

5. **Analytics**
   - [ ] Set up PostHog production project
   - [ ] Configure event tracking
   - [ ] Set up dashboards

6. **Security**
   - [ ] Enable HTTPS
   - [ ] Configure CORS
   - [ ] Set up rate limiting
   - [ ] Configure security headers

### Deployment Steps

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

### Railway Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the required environment variables
4. Deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Your application URL | Yes |
| `NEXTAUTH_SECRET` | Random string for session encryption | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | No |
| `SENTRY_DSN` | Sentry Data Source Name | No |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | No |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL | No |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
