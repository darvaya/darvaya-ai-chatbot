import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface ValidationErrorProps {
  error: z.ZodError | Error | null;
  title?: string;
}

export function ValidationError({
  error,
  title = 'Validation Error',
}: ValidationErrorProps) {
  if (!error) return null;

  const errors =
    error instanceof z.ZodError
      ? error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }))
      : [{ path: 'error', message: error.message }];

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          {errors.map((err) => (
            <li key={`${err.path}-${err.message}`} className="text-sm">
              {err.path !== 'error' && (
                <span className="font-medium">{err.path}: </span>
              )}
              {err.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
