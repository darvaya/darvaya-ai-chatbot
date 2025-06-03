# File Uploads with AWS S3

This guide explains how to implement file uploads using AWS S3 or any S3-compatible storage service in your application.

## Prerequisites

1. An AWS S3 bucket or S3-compatible storage (e.g., DigitalOcean Spaces, Cloudflare R2, MinIO)
2. AWS Access Key ID and Secret Access Key with appropriate permissions
3. Bucket name and region

## Setup

### 1. Install Dependencies

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Required
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: For S3-compatible services
# AWS_ENDPOINT=https://your-endpoint.com
# AWS_FORCE_PATH_STYLE=true
# AWS_S3_PUBLIC_URL=https://your-cdn-url.com
```

## Components

### FileUpload Component

A ready-to-use React component for handling file uploads:

```tsx
import { FileUpload } from '@/components/FileUpload';

function MyComponent() {
  const handleUpload = (url: string) => {
    console.log('File uploaded:', url);
    // Save the URL to your database or state
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

### useFileUpload Hook

For more control, use the `useFileUpload` hook:

```tsx
import { useFileUpload } from '@/hooks/useFileUpload';

function MyComponent() {
  const { upload, isUploading, progress, error } = useFileUpload({
    path: 'user-uploads',
    onSuccess: (url) => console.log('Uploaded:', url),
    onError: (error) => console.error('Upload failed:', error),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await upload(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <div>Uploading... {progress}%</div>}
      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
```

## File Validation

Use the `file-utils.ts` helper for client-side file validation:

```typescript
import { validateFile } from '@/lib/file-utils';

async function handleFileSelect(file: File) {
  const result = await validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (!result.isValid) {
    alert(result.error);
    return;
  }

  // Proceed with upload
}
```

## Server-Side API

File uploads are handled by the API route at `/api/upload`:

- `POST /api/upload` - Upload a file
- `DELETE /api/upload?url={fileUrl}` - Delete a file

### Example: Uploading a File

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('path', 'optional/path/prefix');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const { url } = await response.json();
```

## Security Considerations

1. **File Type Validation**: Always validate file types on both client and server
2. **File Size Limits**: Enforce reasonable size limits
3. **CORS**: Configure CORS on your S3 bucket
4. **Bucket Policies**: Use IAM policies to restrict access
5. **Signed URLs**: Use signed URLs for private files

## Example Implementation

See the example implementation at `/app/examples/file-upload` for a complete working example.

## Troubleshooting

### Common Issues

1. **Access Denied**
   - Verify AWS credentials have correct permissions
   - Check bucket policy and CORS configuration

2. **CORS Errors**
   - Configure CORS on your S3 bucket
   - Ensure `AWS_S3_PUBLIC_URL` is set if using a CDN

3. **Slow Uploads**
   - Consider using multipart upload for large files
   - Enable transfer acceleration if using AWS S3

## Advanced Usage

### Customizing the Storage Layer

You can modify the storage implementation in `lib/storage.ts` to support different storage providers or add custom logic.

### Image Processing

For image processing (resizing, optimization), consider adding a serverless function or using a service like:

- AWS Lambda with Sharp
- Cloudinary
- Imgix
- Thumbor

### CDN Integration

For better performance, configure a CDN in front of your S3 bucket and set the `AWS_S3_PUBLIC_URL` environment variable.
