"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";

export default function FileUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleUploadComplete = (url: string) => {
    setUploadedFiles((prev) => [...prev, url]);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold">File Upload Example</h1>
          <p className="text-muted-foreground">
            Example implementation of file uploads with AWS S3
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Image Upload</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload images with preview and size validation (max 5MB)
            </p>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              accept="image/*"
              maxSizeMB={5}
              className="mb-4"
            />
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Document Upload</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload PDF or Word documents (max 10MB)
            </p>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              accept=".pdf,.doc,.docx"
              maxSizeMB={10}
              className="mb-4"
            />
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-xl font-semibold">Uploaded Files</h2>
            <div className="space-y-2">
              {uploadedFiles.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded border p-3 hover:bg-muted/50"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-4 flex-1 truncate text-blue-600 hover:underline"
                    title={url}
                  >
                    File {index + 1}
                  </a>
                  <span className="text-sm text-muted-foreground">
                    {new URL(url).pathname.split("/").pop()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-muted/50 p-6">
          <h2 className="mb-4 text-xl font-semibold">Implementation</h2>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">
                Using the FileUpload component:
              </h3>
              <pre className="overflow-x-auto rounded-md bg-black/80 p-4 text-sm text-white">
                {`import { FileUpload } from '@/components/FileUpload';

function MyComponent() {
  const handleUpload = (url: string) => {
    console.log('File uploaded:', url);
  };

  return (
    <FileUpload 
      onUploadComplete={handleUpload}
      accept="image/*"
      maxSizeMB={5}
      path="user-uploads"
    />
  );
}`}
              </pre>
            </div>

            <div>
              <h3 className="mb-2 font-medium">
                Using the useFileUpload hook:
              </h3>
              <pre className="overflow-x-auto rounded-md bg-black/80 p-4 text-sm text-white">
                {`import { useFileUpload } from '@/hooks/useFileUpload';

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
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
