export interface FileValidationOptions {
  /**
   * Maximum file size in bytes
   * @default 10MB
   */
  maxSize?: number;

  /**
   * Allowed MIME types
   * @default ['image/*']
   */
  allowedTypes?: string[];

  /**
   * Whether to allow multiple files
   * @default false
   */
  multiple?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  file?: File;
  files?: File[];
}

/**
 * Validates a file against the specified options
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {},
): Promise<FileValidationResult> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ["image/*"],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !isFileTypeAllowed(file, allowedTypes)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return {
    isValid: true,
    file,
  };
}

/**
 * Validates multiple files against the specified options
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {},
): Promise<FileValidationResult> {
  const { multiple = false } = options;

  if (!multiple && files.length > 1) {
    return {
      isValid: false,
      error: "Multiple files are not allowed",
    };
  }

  const validationResults = await Promise.all(
    files.map((file) => validateFile(file, options)),
  );

  const invalidFiles = validationResults.filter((result) => !result.isValid);

  if (invalidFiles.length > 0) {
    return {
      isValid: false,
      error: invalidFiles[0].error || "Invalid file(s)",
    };
  }

  return {
    isValid: true,
    files: validationResults
      .filter(
        (result): result is { isValid: true; file: File } =>
          result.isValid && !!result.file,
      )
      .map((result) => result.file),
  };
}

/**
 * Checks if a file's type is allowed based on MIME type patterns
 */
function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.includes("*/*") || allowedTypes.includes(file.type)) {
    return true;
  }

  return allowedTypes.some((pattern) => {
    const [type, subtype] = pattern.split("/");
    const [fileType, fileSubtype] = file.type.split("/");

    if (type === fileType && (subtype === "*" || subtype === fileSubtype)) {
      return true;
    }

    return false;
  });
}

/**
 * Formats file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Converts a file to a base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Extracts file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const name = originalName.replace(/\.[^/.]+$/, ""); // Remove extension

  return `${name}-${timestamp}-${random}.${ext}`;
}
