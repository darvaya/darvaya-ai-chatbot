# DarvayaAI Chatbot

A commercial-ready AI chatbot built with Next.js, featuring authentication, analytics, and monitoring. Optimized for deployment on Railway.

## Features

- 🔐 Authentication with NextAuth.js and Google OAuth
- 📊 Analytics with PostHog
- 🔍 Error tracking with Sentry
- 💬 AI Chat with OpenAI GPT-4
- 🎨 Beautiful UI with Tailwind CSS
- 🚀 Optimized for Railway Deployment
- 🔄 Real-time streaming responses
- 📱 Responsive design
- 🔒 Type-safe with TypeScript
- 🗄️ Database with PostgreSQL and Drizzle ORM
- 📁 File uploads with AWS S3 or S3-compatible storage
  - Drag-and-drop file uploads
  - Image previews
  - File type validation
  - Progress tracking
  - Secure file access with signed URLs

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
  - AWS SDK v3
  - S3-compatible services support (DigitalOcean Spaces, Cloudflare R2, MinIO, etc.)
  - Signed URLs for secure file access
- **Deployment:** Railway

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (optional)
- pnpm
- AWS S3 bucket or S3-compatible storage (for file uploads)
- Docker and Docker Compose (recommended for local development)

### Installation

#### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/darvaya/darvaya-ai-chatbot.git
cd darvaya-ai-chatbot

# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

#### Option 2: Manual Setup

1. Clone the repository:
```bash
git clone https://github.com/darvaya/darvaya-ai-chatbot.git
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
5. Start PostgreSQL and Redis services
6. Run database migrations:
```bash
pnpm db:push
```
7. Start the development server:
```bash
pnpm dev
```

## File Uploads

The application includes a robust file upload system using AWS S3 or any S3-compatible storage service.

### Features

- Drag and drop file uploads
- File type validation
- Progress tracking
- Image previews
- Secure file access with signed URLs
- Support for public/private files
- File deletion

### Configuration

1. Set up an S3 bucket or use an S3-compatible service (DigitalOcean Spaces, Cloudflare R2, MinIO, etc.)
2. Configure CORS on your bucket to allow requests from your domain
3. Add these environment variables to your `.env` file:

```bash
# Required AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: For S3-compatible services
# AWS_ENDPOINT=https://your-endpoint.com
# AWS_FORCE_PATH_STYLE=true
# AWS_S3_PUBLIC_URL=https://your-cdn-url.com

# Optional: File upload settings
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB default
NEXT_PUBLIC_ACCEPTED_FILE_TYPES=image/*,.pdf,.doc,.docx
```

### Usage

#### Using the FileUpload Component

```tsx
import { FileUpload } from '@/components/FileUpload';

function MyComponent() {
  const handleUpload = (url: string) => {
    console.log('File uploaded:', url);
  };

  return (
    <FileUpload 
      onUploadComplete={handleUpload}
      accept="image/*"
      maxSizeMB={5}
      path="uploads"
    />
  );
}
```

#### Using the useFileUpload Hook

For more control, use the `useFileUpload` hook:

```tsx
import { useFileUpload } from '@/hooks/useFileUpload';

function MyComponent() {
  const { upload, isUploading, progress, error } = useFileUpload({
    path: 'user-uploads',
    onSuccess: (url) => console.log('Uploaded:', url),
    onError: (error) => console.error('Upload failed:', error),
  });

  // ...
}
```

### API Endpoints

- `POST /api/upload` - Upload a file
  - Body: `FormData` with `file` and optional `path`
  - Returns: `{ url: string }`

- `DELETE /api/upload?url={fileUrl}` - Delete a file
  - Query: `url` - The URL of the file to delete

## Development

For detailed development setup and guidelines, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Key Development Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run type checking
pnpm typecheck

# Run linter
pnpm lint

# Run tests
pnpm test

# Run database migrations
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

## Deployment

### Railway

1. Create a new project on Railway
2. Connect your GitHub repository or deploy using the CLI
3. Configure your environment variables
4. Deploy!

### Manual Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

### Environment Variables

See [.env.example](.env.example) for all available environment variables.

## License

This project is proprietary and confidential.

## Support

For support, please contact [support@darvaya.com](mailto:support@darvaya.com).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [OpenAI](https://openai.com/)
- [Railway](https://railway.app/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [NextAuth.js](https://next-auth.js.org/)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
