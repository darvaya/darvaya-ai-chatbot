# Development Guide

This guide provides detailed instructions for setting up and developing the application locally.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and pnpm
- Git

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/darvaya/darvaya-ai-chatbot.git
   cd darvaya-ai-chatbot
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your configuration.

3. **Start the development environment**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Install dependencies
   pnpm install
   
   # Run database migrations
   pnpm db:push
   
   # Start the development server
   pnpm dev
   ```

4. **Access the application**
   - App: http://localhost:3000
   - pgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Prisma Studio

## File Structure

```
.
├── app/                    # Next.js app directory
├── components/             # Reusable UI components
├── lib/                    # Utility functions and libraries
├── public/                 # Static files
├── styles/                 # Global styles
├── prisma/                 # Database schema and migrations
└── tests/                  # Test files
```

## Environment Variables

See [.env.example](.env.example) for all available environment variables.

## Code Style

- Use TypeScript
- Follow the [Next.js style guide](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- Use Prettier for code formatting
- Use ESLint for code quality

## Git Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push your changes and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

## Testing

Run tests with:
```bash
pnpm test
```

## Deployment

### Production Build
```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Docker
```bash
# Build the Docker image
docker build -t darvaya-ai-chatbot .

# Run the container
docker run -p 3000:3000 --env-file .env darvaya-ai-chatbot
```

## Troubleshooting

### Database Issues
- Make sure PostgreSQL and Redis are running
- Run migrations with `pnpm db:push`
- Check logs with `docker-compose logs -f postgres`

### Build Issues
- Clear the Next.js cache: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`

## License

This project is proprietary and confidential.
