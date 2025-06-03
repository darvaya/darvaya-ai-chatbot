import { useState, useCallback } from "react";

interface UseFileUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  path?: string;
}

export function useFileUpload({
  onSuccess,
  onError,
  path,
}: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File) => {
      if (!file) {
        const err = new Error("No file provided");
        setError(err);
        onError?.(err);
        return null;
      }

      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (path) {
          formData.append("path", path);
        }

        // Simulate progress (optional)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 100);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        onSuccess?.(data.url);
        return data.url;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [onSuccess, onError, path],
  );

  const remove = useCallback(
    async (url: string) => {
      try {
        const response = await fetch(
          `/api/upload?url=${encodeURIComponent(url)}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to delete file");
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Delete failed");
        setError(error);
        onError?.(error);
        return false;
      }
    },
    [onError],
  );

  return {
    upload,
    remove,
    isUploading,
    progress,
    error,
  };
}

export default useFileUpload;
