"use client";

import { useCallback, useState } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";

interface FileUploadProps {
  onUploadComplete?: (url: string) => void;
  path?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  onUploadComplete,
  path,
  accept = "image/*",
  maxSizeMB = 10,
  className = "",
  children,
}: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    upload,
    isUploading,
    progress,
    error: uploadError,
  } = useFileUpload({
    path,
    onSuccess: (url) => {
      setPreviewUrl(url);
      onUploadComplete?.(url);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      // Reset state
      setError(null);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Upload the file
      await upload(file);
    },
    [upload, maxSizeMB],
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex w-full items-center justify-center">
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 transition-colors hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pb-6 pt-5">
            <svg
              className="mb-2 size-8 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">
              {accept
                ? `${accept} (max ${maxSizeMB}MB)`
                : `File (max ${maxSizeMB}MB)`}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div className="h-2.5 w-full rounded-full bg-gray-200">
          <div
            className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Preview */}
      {previewUrl && !isUploading && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-gray-700">Preview:</p>
          {previewUrl.startsWith("data:image") ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-40 rounded-md object-cover"
            />
          ) : (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View uploaded file
            </a>
          )}
        </div>
      )}

      {/* Error message */}
      {(error || uploadError) && (
        <p className="text-sm text-red-600">
          {error || uploadError?.message || "An error occurred during upload"}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
