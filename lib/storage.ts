import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_ENDPOINT, // Optional: For S3-compatible services
  forcePathStyle: !!process.env.AWS_FORCE_PATH_STYLE, // Required for S3-compatible services
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadFileParams {
  file: Buffer;
  fileName: string;
  contentType: string;
  path?: string;
}

export async function uploadFile({
  file,
  fileName,
  contentType,
  path = "",
}: UploadFileParams) {
  const key = path ? `${path}/${fileName}` : fileName;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);

    // Return the public URL or signed URL
    if (process.env.AWS_S3_PUBLIC_URL) {
      // If using a CDN or public URL
      return `${process.env.AWS_S3_PUBLIC_URL}/${key}`;
    } else {
      // Generate a signed URL that expires in 7 days
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, getCommand, {
        expiresIn: 60 * 60 * 24 * 7,
      });
      return url;
    }
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file");
  }
}

export async function getFileUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating file URL:", error);
    throw new Error("Failed to generate file URL");
  }
}

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file");
  }
}

// For handling file uploads from API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // Adjust based on your needs
    },
  },
};
